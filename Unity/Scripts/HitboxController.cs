using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace SmashMoves
{
    public class HitboxController : MonoBehaviour
    {
        [Header("Move Data")]
        public MoveData currentMove;
        
        [Header("Hitbox Objects")]
        public GameObject[] hitboxObjects; // Pre-created hitbox GameObjects
        public int maxHitboxes = 10;
        
        [Header("Timing")]
        public int currentFrame = 0;
        public bool isActive = false;
        public bool isPaused = false;
        
        [Header("Debug")]
        public bool showDebugInfo = true;
        public bool showHitboxGizmos = true;
        
        private Dictionary<int, List<HitboxData>> frameToHitboxes;
        private List<GameObject> activeHitboxes = new List<GameObject>();
        private Coroutine moveCoroutine;
        
        // Events
        public System.Action<MoveData> OnMoveStarted;
        public System.Action<MoveData> OnMoveCompleted;
        public System.Action<int> OnFrameChanged;
        
        void Start()
        {
            InitializeHitboxes();
        }
        
        void InitializeHitboxes()
        {
            // Create hitbox objects if they don't exist
            if (hitboxObjects == null || hitboxObjects.Length == 0)
            {
                CreateHitboxObjects();
            }
            
            // Ensure all hitboxes are inactive initially
            foreach (var hitbox in hitboxObjects)
            {
                if (hitbox != null)
                {
                    hitbox.SetActive(false);
                }
            }
        }
        
        void CreateHitboxObjects()
        {
            hitboxObjects = new GameObject[maxHitboxes];
            for (int i = 0; i < maxHitboxes; i++)
            {
                GameObject hitbox = new GameObject($"Hitbox_{i}");
                hitbox.transform.SetParent(transform);
                
                // Add collider
                BoxCollider collider = hitbox.AddComponent<BoxCollider>();
                collider.isTrigger = true;
                
                // Add hitbox component
                Hitbox hitboxComponent = hitbox.AddComponent<Hitbox>();
                hitboxComponent.Initialize(this);
                
                // Add visual representation for debugging
                GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Cube);
                visual.transform.SetParent(hitbox.transform);
                visual.transform.localScale = Vector3.one;
                visual.transform.localPosition = Vector3.zero;
                
                // Remove the primitive's collider and set up visual
                Collider visualCollider = visual.GetComponent<Collider>();
                if (visualCollider != null)
                {
                    DestroyImmediate(visualCollider);
                }
                
                Renderer visualRenderer = visual.GetComponent<Renderer>();
                if (visualRenderer != null)
                {
                    Material hitboxMaterial = new Material(Shader.Find("Standard"));
                    hitboxMaterial.color = new Color(1, 0, 0, 0.3f);
                    hitboxMaterial.SetFloat("_Mode", 3); // Transparent mode
                    hitboxMaterial.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
                    hitboxMaterial.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                    hitboxMaterial.SetInt("_ZWrite", 0);
                    hitboxMaterial.DisableKeyword("_ALPHATEST_ON");
                    hitboxMaterial.EnableKeyword("_ALPHABLEND_ON");
                    hitboxMaterial.DisableKeyword("_ALPHAPREMULTIPLY_ON");
                    hitboxMaterial.renderQueue = 3000;
                    visualRenderer.material = hitboxMaterial;
                }
                
                hitbox.SetActive(false);
                hitboxObjects[i] = hitbox;
            }
        }
        
        public void StartMove(MoveData move)
        {
            if (move == null)
            {
                Debug.LogError("Cannot start move: MoveData is null");
                return;
            }
            
            // Stop any existing move
            if (moveCoroutine != null)
            {
                StopCoroutine(moveCoroutine);
            }
            
            currentMove = move;
            currentFrame = 0;
            isActive = true;
            isPaused = false;
            
            // Parse move data into frame-based dictionary
            ParseMoveData();
            
            // Start coroutine for frame-by-frame execution
            moveCoroutine = StartCoroutine(ExecuteMove());
            
            // Trigger event
            OnMoveStarted?.Invoke(currentMove);
            
            if (showDebugInfo)
            {
                Debug.Log($"Starting move: {currentMove.moveName} (Startup: {currentMove.startupFrames}, Active: {currentMove.activeFrames}, End: {currentMove.endLag})");
            }
        }
        
        void ParseMoveData()
        {
            frameToHitboxes = new Dictionary<int, List<HitboxData>>();
            
            if (currentMove.hitboxes != null)
            {
                foreach (var hitbox in currentMove.hitboxes)
                {
                    int frame = hitbox.frame;
                    if (!frameToHitboxes.ContainsKey(frame))
                        frameToHitboxes[frame] = new List<HitboxData>();
                    frameToHitboxes[frame].Add(hitbox);
                }
            }
        }
        
        IEnumerator ExecuteMove()
        {
            // Startup frames
            for (int i = 0; i < currentMove.startupFrames; i++)
            {
                if (!isPaused)
                {
                    yield return new WaitForFixedUpdate();
                    currentFrame++;
                    OnFrameChanged?.Invoke(currentFrame);
                }
                else
                {
                    yield return null;
                }
            }
            
            // Active frames
            for (int i = 0; i < currentMove.activeFrames; i++)
            {
                if (!isPaused)
                {
                    UpdateHitboxes();
                    yield return new WaitForFixedUpdate();
                    currentFrame++;
                    OnFrameChanged?.Invoke(currentFrame);
                }
                else
                {
                    yield return null;
                }
            }
            
            // End lag
            for (int i = 0; i < currentMove.endLag; i++)
            {
                if (!isPaused)
                {
                    yield return new WaitForFixedUpdate();
                    currentFrame++;
                    OnFrameChanged?.Invoke(currentFrame);
                }
                else
                {
                    yield return null;
                }
            }
            
            // Move complete
            isActive = false;
            DeactivateAllHitboxes();
            
            // Trigger event
            OnMoveCompleted?.Invoke(currentMove);
            
            if (showDebugInfo)
            {
                Debug.Log($"Move completed: {currentMove.moveName}");
            }
        }
        
        void UpdateHitboxes()
        {
            // Deactivate all hitboxes first
            DeactivateAllHitboxes();
            
            // Activate hitboxes for current frame
            if (frameToHitboxes != null && frameToHitboxes.ContainsKey(currentFrame))
            {
                foreach (var hitboxData in frameToHitboxes[currentFrame])
                {
                    ActivateHitbox(hitboxData);
                }
            }
        }
        
        void ActivateHitbox(HitboxData data)
        {
            // Find available hitbox object
            GameObject hitboxObj = GetAvailableHitbox();
            if (hitboxObj == null)
            {
                Debug.LogWarning("No available hitbox objects!");
                return;
            }
            
            // Configure hitbox
            Hitbox hitbox = hitboxObj.GetComponent<Hitbox>();
            hitbox.Configure(data);
            
            // Position and size
            hitboxObj.transform.localPosition = data.offset;
            hitboxObj.transform.localScale = data.size;
            
            // Activate
            hitboxObj.SetActive(true);
            activeHitboxes.Add(hitboxObj);
            
            if (showDebugInfo)
            {
                Debug.Log($"Activated hitbox on frame {currentFrame} at {data.offset} with size {data.size}");
            }
        }
        
        GameObject GetAvailableHitbox()
        {
            foreach (var hitbox in hitboxObjects)
            {
                if (hitbox != null && !hitbox.activeInHierarchy)
                    return hitbox;
            }
            return null;
        }
        
        void DeactivateAllHitboxes()
        {
            foreach (var hitbox in activeHitboxes)
            {
                if (hitbox != null)
                {
                    hitbox.SetActive(false);
                }
            }
            activeHitboxes.Clear();
        }
        
        public void PauseMove()
        {
            isPaused = true;
        }
        
        public void ResumeMove()
        {
            isPaused = false;
        }
        
        public void StopMove()
        {
            if (moveCoroutine != null)
            {
                StopCoroutine(moveCoroutine);
                moveCoroutine = null;
            }
            
            isActive = false;
            isPaused = false;
            DeactivateAllHitboxes();
        }
        
        public bool CanStartMove()
        {
            return !isActive;
        }
        
        public float GetMoveProgress()
        {
            if (currentMove == null || !isActive) return 0f;
            
            int totalFrames = currentMove.startupFrames + currentMove.activeFrames + currentMove.endLag;
            return (float)currentFrame / totalFrames;
        }
        
        void OnDrawGizmos()
        {
            if (!showHitboxGizmos || !isActive) return;
            
            // Draw active hitboxes
            foreach (var hitbox in activeHitboxes)
            {
                if (hitbox != null && hitbox.activeInHierarchy)
                {
                    Gizmos.color = Color.red;
                    Gizmos.matrix = hitbox.transform.localToWorldMatrix;
                    Gizmos.DrawWireCube(Vector3.zero, Vector3.one);
                    
                    Gizmos.color = new Color(1, 0, 0, 0.2f);
                    Gizmos.DrawCube(Vector3.zero, Vector3.one);
                }
            }
        }
    }
}
