using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Threading.Tasks;
using UnityEngine.UI;

namespace SmashMoves
{
    public class FirebaseMoveBuilder : MonoBehaviour
    {
        [Header("Firebase")]
        public FirebaseManager firebaseManager;
        public FirebaseMoveDataLoader moveDataLoader;
        
        [Header("UI References")]
        public InputField moveNameInput;
        public Dropdown moveTypeDropdown;
        public Dropdown rarityDropdown;
        public InputField startupFramesInput;
        public InputField activeFramesInput;
        public InputField endLagInput;
        public InputField onShieldLagInput;
        public InputField damageInput;
        public InputField shieldStunInput;
        public InputField notesInput;
        public Button saveButton;
        public Button loadButton;
        public Button deleteButton;
        public Text statusText;
        
        [Header("Hitbox Builder")]
        public Transform hitboxContainer;
        public GameObject hitboxPrefab;
        public Button addHitboxButton;
        public Button removeHitboxButton;
        
        [Header("Debug")]
        public bool showDebugInfo = true;
        
        private MoveData currentMove;
        private List<GameObject> hitboxUIElements = new List<GameObject>();
        
        void Start()
        {
            InitializeUI();
            SetupEventListeners();
        }
        
        void InitializeUI()
        {
            // Initialize dropdowns
            if (moveTypeDropdown != null)
            {
                moveTypeDropdown.ClearOptions();
                moveTypeDropdown.AddOptions(new List<string> { "Normal", "Special", "Movement", "Finisher", "Utility" });
            }
            
            if (rarityDropdown != null)
            {
                rarityDropdown.ClearOptions();
                rarityDropdown.AddOptions(new List<string> { "Common", "Uncommon", "Rare", "Epic", "Legendary" });
            }
            
            // Set default values
            if (startupFramesInput != null) startupFramesInput.text = "0";
            if (activeFramesInput != null) activeFramesInput.text = "1";
            if (endLagInput != null) endLagInput.text = "0";
            if (onShieldLagInput != null) onShieldLagInput.text = "0";
            if (damageInput != null) damageInput.text = "0";
            if (shieldStunInput != null) shieldStunInput.text = "0";
        }
        
        void SetupEventListeners()
        {
            if (saveButton != null)
                saveButton.onClick.AddListener(SaveMove);
            
            if (loadButton != null)
                loadButton.onClick.AddListener(LoadMove);
            
            if (deleteButton != null)
                deleteButton.onClick.AddListener(DeleteMove);
            
            if (addHitboxButton != null)
                addHitboxButton.onClick.AddListener(AddHitbox);
            
            if (removeHitboxButton != null)
                removeHitboxButton.onClick.AddListener(RemoveHitbox);
        }
        
        public void CreateNewMove()
        {
            currentMove = new MoveData
            {
                moveId = System.Guid.NewGuid().ToString(),
                moveName = "New Move",
                moveType = MoveType.Normal,
                rarity = Rarity.Common,
                startupFrames = 0,
                activeFrames = 1,
                endLag = 0,
                onShieldLag = 0,
                damage = 0,
                shieldStun = 0,
                notes = "",
                links = new string[0],
                hitboxes = new HitboxData[0],
                createdAt = System.DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            };
            
            PopulateUI();
            ClearHitboxes();
            UpdateStatus("New move created");
        }
        
        void PopulateUI()
        {
            if (currentMove == null) return;
            
            if (moveNameInput != null) moveNameInput.text = currentMove.moveName;
            if (moveTypeDropdown != null) moveTypeDropdown.value = (int)currentMove.moveType;
            if (rarityDropdown != null) rarityDropdown.value = (int)currentMove.rarity;
            if (startupFramesInput != null) startupFramesInput.text = currentMove.startupFrames.ToString();
            if (activeFramesInput != null) activeFramesInput.text = currentMove.activeFrames.ToString();
            if (endLagInput != null) endLagInput.text = currentMove.endLag.ToString();
            if (onShieldLagInput != null) onShieldLagInput.text = currentMove.onShieldLag.ToString();
            if (damageInput != null) damageInput.text = currentMove.damage.ToString();
            if (shieldStunInput != null) shieldStunInput.text = currentMove.shieldStun.ToString();
            if (notesInput != null) notesInput.text = currentMove.notes;
            
            // Populate hitboxes
            PopulateHitboxes();
        }
        
        void PopulateHitboxes()
        {
            ClearHitboxes();
            
            if (currentMove.hitboxes != null)
            {
                foreach (var hitbox in currentMove.hitboxes)
                {
                    CreateHitboxUI(hitbox);
                }
            }
        }
        
        void CreateHitboxUI(HitboxData hitbox)
        {
            if (hitboxPrefab == null || hitboxContainer == null) return;
            
            GameObject hitboxUI = Instantiate(hitboxPrefab, hitboxContainer);
            hitboxUIElements.Add(hitboxUI);
            
            // Configure hitbox UI elements
            var frameInput = hitboxUI.transform.Find("FrameInput")?.GetComponent<InputField>();
            var offsetXInput = hitboxUI.transform.Find("OffsetXInput")?.GetComponent<InputField>();
            var offsetYInput = hitboxUI.transform.Find("OffsetYInput")?.GetComponent<InputField>();
            var sizeXInput = hitboxUI.transform.Find("SizeXInput")?.GetComponent<InputField>();
            var sizeYInput = hitboxUI.transform.Find("SizeYInput")?.GetComponent<InputField>();
            var angleInput = hitboxUI.transform.Find("AngleInput")?.GetComponent<InputField>();
            var baseKnockbackInput = hitboxUI.transform.Find("BaseKnockbackInput")?.GetComponent<InputField>();
            var knockbackGrowthInput = hitboxUI.transform.Find("KnockbackGrowthInput")?.GetComponent<InputField>();
            var hitstunInput = hitboxUI.transform.Find("HitstunInput")?.GetComponent<InputField>();
            
            if (frameInput != null) frameInput.text = hitbox.frame.ToString();
            if (offsetXInput != null) offsetXInput.text = hitbox.offset.x.ToString();
            if (offsetYInput != null) offsetYInput.text = hitbox.offset.y.ToString();
            if (sizeXInput != null) sizeXInput.text = hitbox.size.x.ToString();
            if (sizeYInput != null) sizeYInput.text = hitbox.size.y.ToString();
            if (angleInput != null) angleInput.text = hitbox.angle.ToString();
            if (baseKnockbackInput != null) baseKnockbackInput.text = hitbox.baseKnockback.ToString();
            if (knockbackGrowthInput != null) knockbackGrowthInput.text = hitbox.knockbackGrowth.ToString();
            if (hitstunInput != null) hitstunInput.text = hitbox.hitstun.ToString();
        }
        
        void AddHitbox()
        {
            if (currentMove == null)
            {
                UpdateStatus("Please create a move first");
                return;
            }
            
            HitboxData newHitbox = new HitboxData
            {
                frame = 0,
                offset = Vector3.zero,
                size = Vector3.one,
                angle = 0,
                baseKnockback = 5,
                knockbackGrowth = 1,
                hitstun = 10,
                canHitMultipleTimes = false,
                hitEffect = "default_hit"
            };
            
            if (currentMove.hitboxes == null)
            {
                currentMove.hitboxes = new HitboxData[0];
            }
            
            var hitboxList = new List<HitboxData>(currentMove.hitboxes);
            hitboxList.Add(newHitbox);
            currentMove.hitboxes = hitboxList.ToArray();
            
            CreateHitboxUI(newHitbox);
            UpdateStatus("Hitbox added");
        }
        
        void RemoveHitbox()
        {
            if (hitboxUIElements.Count > 0)
            {
                GameObject lastHitbox = hitboxUIElements[hitboxUIElements.Count - 1];
                hitboxUIElements.Remove(lastHitbox);
                Destroy(lastHitbox);
                
                if (currentMove != null && currentMove.hitboxes != null && currentMove.hitboxes.Length > 0)
                {
                    var hitboxList = new List<HitboxData>(currentMove.hitboxes);
                    hitboxList.RemoveAt(hitboxList.Count - 1);
                    currentMove.hitboxes = hitboxList.ToArray();
                }
                
                UpdateStatus("Hitbox removed");
            }
        }
        
        void ClearHitboxes()
        {
            foreach (var hitboxUI in hitboxUIElements)
            {
                if (hitboxUI != null)
                    Destroy(hitboxUI);
            }
            hitboxUIElements.Clear();
        }
        
        public async void SaveMove()
        {
            if (currentMove == null)
            {
                UpdateStatus("No move to save");
                return;
            }
            
            // Update move data from UI
            UpdateMoveFromUI();
            
            // Validate move data
            if (!ValidateMoveData())
            {
                UpdateStatus("Invalid move data");
                return;
            }
            
            UpdateStatus("Saving move...");
            
            if (moveDataLoader != null)
            {
                bool success = await moveDataLoader.SaveMoveToFirebase(currentMove);
                if (success)
                {
                    UpdateStatus($"Move saved: {currentMove.moveName}");
                }
                else
                {
                    UpdateStatus("Failed to save move");
                }
            }
            else
            {
                UpdateStatus("Move data loader not found");
            }
        }
        
        public async void LoadMove()
        {
            if (moveNameInput == null || string.IsNullOrEmpty(moveNameInput.text))
            {
                UpdateStatus("Enter move name to load");
                return;
            }
            
            UpdateStatus("Loading move...");
            
            if (moveDataLoader != null)
            {
                // Try to find move by name
                var allMoves = moveDataLoader.GetAllMoves();
                MoveData foundMove = allMoves.Find(m => m.moveName == moveNameInput.text);
                
                if (foundMove != null)
                {
                    currentMove = foundMove;
                    PopulateUI();
                    UpdateStatus($"Move loaded: {foundMove.moveName}");
                }
                else
                {
                    UpdateStatus("Move not found");
                }
            }
            else
            {
                UpdateStatus("Move data loader not found");
            }
        }
        
        public async void DeleteMove()
        {
            if (currentMove == null)
            {
                UpdateStatus("No move to delete");
                return;
            }
            
            UpdateStatus("Deleting move...");
            
            if (moveDataLoader != null)
            {
                bool success = await moveDataLoader.DeleteMoveFromFirebase(currentMove.moveId);
                if (success)
                {
                    UpdateStatus($"Move deleted: {currentMove.moveName}");
                    currentMove = null;
                    ClearUI();
                }
                else
                {
                    UpdateStatus("Failed to delete move");
                }
            }
            else
            {
                UpdateStatus("Move data loader not found");
            }
        }
        
        void UpdateMoveFromUI()
        {
            if (currentMove == null) return;
            
            if (moveNameInput != null) currentMove.moveName = moveNameInput.text;
            if (moveTypeDropdown != null) currentMove.moveType = (MoveType)moveTypeDropdown.value;
            if (rarityDropdown != null) currentMove.rarity = (Rarity)rarityDropdown.value;
            
            if (int.TryParse(startupFramesInput?.text, out int startup)) currentMove.startupFrames = startup;
            if (int.TryParse(activeFramesInput?.text, out int active)) currentMove.activeFrames = active;
            if (int.TryParse(endLagInput?.text, out int endLag)) currentMove.endLag = endLag;
            if (int.TryParse(onShieldLagInput?.text, out int shieldLag)) currentMove.onShieldLag = shieldLag;
            if (float.TryParse(damageInput?.text, out float damage)) currentMove.damage = damage;
            if (int.TryParse(shieldStunInput?.text, out int shieldStun)) currentMove.shieldStun = shieldStun;
            
            if (notesInput != null) currentMove.notes = notesInput.text;
            
            // Update hitboxes from UI
            UpdateHitboxesFromUI();
        }
        
        void UpdateHitboxesFromUI()
        {
            if (currentMove == null || hitboxUIElements.Count == 0)
            {
                currentMove.hitboxes = new HitboxData[0];
                return;
            }
            
            List<HitboxData> hitboxes = new List<HitboxData>();
            
            foreach (var hitboxUI in hitboxUIElements)
            {
                if (hitboxUI == null) continue;
                
                HitboxData hitbox = new HitboxData();
                
                var frameInput = hitboxUI.transform.Find("FrameInput")?.GetComponent<InputField>();
                var offsetXInput = hitboxUI.transform.Find("OffsetXInput")?.GetComponent<InputField>();
                var offsetYInput = hitboxUI.transform.Find("OffsetYInput")?.GetComponent<InputField>();
                var sizeXInput = hitboxUI.transform.Find("SizeXInput")?.GetComponent<InputField>();
                var sizeYInput = hitboxUI.transform.Find("SizeYInput")?.GetComponent<InputField>();
                var angleInput = hitboxUI.transform.Find("AngleInput")?.GetComponent<InputField>();
                var baseKnockbackInput = hitboxUI.transform.Find("BaseKnockbackInput")?.GetComponent<InputField>();
                var knockbackGrowthInput = hitboxUI.transform.Find("KnockbackGrowthInput")?.GetComponent<InputField>();
                var hitstunInput = hitboxUI.transform.Find("HitstunInput")?.GetComponent<InputField>();
                
                if (int.TryParse(frameInput?.text, out int frame)) hitbox.frame = frame;
                if (float.TryParse(offsetXInput?.text, out float offsetX)) hitbox.offset.x = offsetX;
                if (float.TryParse(offsetYInput?.text, out float offsetY)) hitbox.offset.y = offsetY;
                if (float.TryParse(sizeXInput?.text, out float sizeX)) hitbox.size.x = sizeX;
                if (float.TryParse(sizeYInput?.text, out float sizeY)) hitbox.size.y = sizeY;
                if (float.TryParse(angleInput?.text, out float angle)) hitbox.angle = angle;
                if (float.TryParse(baseKnockbackInput?.text, out float baseKnockback)) hitbox.baseKnockback = baseKnockback;
                if (float.TryParse(knockbackGrowthInput?.text, out float knockbackGrowth)) hitbox.knockbackGrowth = knockbackGrowth;
                if (int.TryParse(hitstunInput?.text, out int hitstun)) hitbox.hitstun = hitstun;
                
                hitbox.canHitMultipleTimes = false;
                hitbox.hitEffect = "default_hit";
                
                hitboxes.Add(hitbox);
            }
            
            currentMove.hitboxes = hitboxes.ToArray();
        }
        
        bool ValidateMoveData()
        {
            if (currentMove == null) return false;
            
            if (string.IsNullOrEmpty(currentMove.moveName)) return false;
            if (currentMove.startupFrames < 0) return false;
            if (currentMove.activeFrames < 1) return false;
            if (currentMove.endLag < 0) return false;
            if (currentMove.damage < 0) return false;
            
            return true;
        }
        
        void ClearUI()
        {
            if (moveNameInput != null) moveNameInput.text = "";
            if (moveTypeDropdown != null) moveTypeDropdown.value = 0;
            if (rarityDropdown != null) rarityDropdown.value = 0;
            if (startupFramesInput != null) startupFramesInput.text = "0";
            if (activeFramesInput != null) activeFramesInput.text = "1";
            if (endLagInput != null) endLagInput.text = "0";
            if (onShieldLagInput != null) onShieldLagInput.text = "0";
            if (damageInput != null) damageInput.text = "0";
            if (shieldStunInput != null) shieldStunInput.text = "0";
            if (notesInput != null) notesInput.text = "";
            
            ClearHitboxes();
        }
        
        void UpdateStatus(string message)
        {
            if (statusText != null)
            {
                statusText.text = message;
            }
            
            if (showDebugInfo)
            {
                Debug.Log($"FirebaseMoveBuilder: {message}");
            }
        }
    }
}
