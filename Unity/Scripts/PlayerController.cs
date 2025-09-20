using UnityEngine;

namespace SmashMoves
{
    public class PlayerController : MonoBehaviour
    {
        [Header("Components")]
        public HitboxController hitboxController;
        public MoveDataLoader moveLoader;
        public CharacterController characterController;
        public Health health;
        public Shield shield;
        
        [Header("Input")]
        public KeyCode lightAttackKey = KeyCode.J;
        public KeyCode heavyAttackKey = KeyCode.K;
        public KeyCode specialAttackKey = KeyCode.L;
        public KeyCode blockKey = KeyCode.Space;
        
        [Header("Current Move")]
        public string currentMoveId = "";
        public MoveData currentMove;
        
        [Header("Debug")]
        public bool showDebugInfo = false;
        
        void Start()
        {
            // Get components if not assigned
            if (hitboxController == null)
                hitboxController = GetComponent<HitboxController>();
            if (moveLoader == null)
                moveLoader = FindObjectOfType<MoveDataLoader>();
            if (characterController == null)
                characterController = GetComponent<CharacterController>();
            if (health == null)
                health = GetComponent<Health>();
            if (shield == null)
                shield = GetComponent<Shield>();
            
            // Subscribe to events
            if (hitboxController != null)
            {
                hitboxController.OnMoveStarted += OnMoveStarted;
                hitboxController.OnMoveCompleted += OnMoveCompleted;
            }
        }
        
        void Update()
        {
            HandleInput();
        }
        
        void HandleInput()
        {
            // Don't process input if in hitstun or if a move is active
            if (characterController != null && characterController.isInHitstun) return;
            if (hitboxController != null && hitboxController.isActive) return;
            
            // Blocking input
            if (shield != null)
            {
                if (Input.GetKey(blockKey))
                {
                    shield.StartBlocking();
                }
                else
                {
                    shield.StopBlocking();
                }
            }
            
            // Attack inputs
            if (Input.GetKeyDown(lightAttackKey))
            {
                ExecuteMove("jab-basic");
            }
            else if (Input.GetKeyDown(heavyAttackKey))
            {
                ExecuteMove("forward-smash");
            }
            else if (Input.GetKeyDown(specialAttackKey))
            {
                ExecuteMove("falcon-punch");
            }
        }
        
        public void ExecuteMove(string moveId)
        {
            if (moveLoader == null || hitboxController == null) return;
            
            MoveData move = moveLoader.GetMove(moveId);
            if (move == null)
            {
                Debug.LogWarning($"Move not found: {moveId}");
                return;
            }
            
            if (!hitboxController.CanStartMove())
            {
                if (showDebugInfo)
                {
                    Debug.Log("Cannot start move: another move is active");
                }
                return;
            }
            
            currentMoveId = moveId;
            currentMove = move;
            
            hitboxController.StartMove(move);
            
            if (showDebugInfo)
            {
                Debug.Log($"Executing move: {move.moveName}");
            }
        }
        
        public void ExecuteRandomMove(Rarity rarity)
        {
            if (moveLoader == null) return;
            
            var moves = moveLoader.GetMovesByRarity(rarity);
            if (moves.Count > 0)
            {
                MoveData randomMove = moves[Random.Range(0, moves.Count)];
                ExecuteMove(randomMove.moveId);
            }
        }
        
        public void ExecuteComboMove(string fromMoveId)
        {
            if (moveLoader == null) return;
            
            var comboOptions = moveLoader.GetMovesThatLinkFrom(fromMoveId);
            if (comboOptions.Count > 0)
            {
                MoveData comboMove = comboOptions[Random.Range(0, comboOptions.Count)];
                ExecuteMove(comboMove.moveId);
            }
        }
        
        void OnMoveStarted(MoveData move)
        {
            if (showDebugInfo)
            {
                Debug.Log($"Move started: {move.moveName}");
            }
        }
        
        void OnMoveCompleted(MoveData move)
        {
            if (showDebugInfo)
            {
                Debug.Log($"Move completed: {move.moveName}");
            }
            
            // Reset current move
            currentMoveId = "";
            currentMove = null;
        }
        
        public bool CanExecuteMove()
        {
            return hitboxController != null && hitboxController.CanStartMove() &&
                   characterController != null && !characterController.isInHitstun;
        }
        
        public float GetMoveProgress()
        {
            return hitboxController != null ? hitboxController.GetMoveProgress() : 0f;
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (hitboxController != null)
            {
                hitboxController.OnMoveStarted -= OnMoveStarted;
                hitboxController.OnMoveCompleted -= OnMoveCompleted;
            }
        }
    }
}
