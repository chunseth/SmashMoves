using UnityEngine;

namespace SmashMoves
{
    public class CharacterController : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 5f;
        public float jumpForce = 10f;
        public float dashSpeed = 15f;
        public float dashDuration = 0.2f;
        
        [Header("State")]
        public bool isGrounded = true;
        public bool isDashing = false;
        public bool isInHitstun = false;
        public int currentHitstun = 0;
        
        [Header("Debug")]
        public bool showDebugInfo = false;
        
        private Rigidbody rb;
        private Vector3 moveInput;
        private float dashTimer = 0f;
        private Vector3 dashDirection;
        
        // Events
        public System.Action OnJump;
        public System.Action OnDash;
        public System.Action<int> OnHitstunApplied;
        public System.Action OnHitstunEnded;
        
        void Start()
        {
            rb = GetComponent<Rigidbody>();
            if (rb == null)
            {
                rb = gameObject.AddComponent<Rigidbody>();
            }
        }
        
        void Update()
        {
            HandleInput();
            HandleHitstun();
            HandleDash();
        }
        
        void HandleInput()
        {
            if (isInHitstun) return;
            
            // Movement input
            moveInput = Vector3.zero;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
            {
                moveInput.x = -1f;
            }
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
            {
                moveInput.x = 1f;
            }
            
            // Jump input
            if ((Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.Space)) && isGrounded)
            {
                Jump();
            }
            
            // Dash input
            if (Input.GetKeyDown(KeyCode.LeftShift) && !isDashing)
            {
                Dash();
            }
        }
        
        void HandleHitstun()
        {
            if (currentHitstun > 0)
            {
                currentHitstun--;
                isInHitstun = true;
                
                if (currentHitstun <= 0)
                {
                    currentHitstun = 0;
                    isInHitstun = false;
                    OnHitstunEnded?.Invoke();
                    
                    if (showDebugInfo)
                    {
                        Debug.Log($"{gameObject.name} hitstun ended");
                    }
                }
            }
        }
        
        void HandleDash()
        {
            if (isDashing)
            {
                dashTimer -= Time.deltaTime;
                
                if (dashTimer <= 0f)
                {
                    isDashing = false;
                    if (showDebugInfo)
                    {
                        Debug.Log($"{gameObject.name} dash ended");
                    }
                }
            }
        }
        
        void FixedUpdate()
        {
            if (isInHitstun) return;
            
            if (isDashing)
            {
                // Apply dash movement
                rb.velocity = new Vector3(dashDirection.x * dashSpeed, rb.velocity.y, 0f);
            }
            else
            {
                // Apply normal movement
                Vector3 targetVelocity = new Vector3(moveInput.x * moveSpeed, rb.velocity.y, 0f);
                rb.velocity = targetVelocity;
            }
        }
        
        public void Jump()
        {
            if (!isGrounded) return;
            
            rb.velocity = new Vector3(rb.velocity.x, jumpForce, 0f);
            isGrounded = false;
            
            OnJump?.Invoke();
            
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} jumped");
            }
        }
        
        public void Dash()
        {
            if (isDashing) return;
            
            dashDirection = moveInput.normalized;
            if (dashDirection == Vector3.zero)
            {
                dashDirection = transform.right; // Default to forward
            }
            
            isDashing = true;
            dashTimer = dashDuration;
            
            OnDash?.Invoke();
            
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} dashed in direction {dashDirection}");
            }
        }
        
        public void ApplyHitstun(int frames)
        {
            currentHitstun = Mathf.Max(currentHitstun, frames);
            isInHitstun = true;
            
            OnHitstunApplied?.Invoke(frames);
            
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} hitstun applied for {frames} frames");
            }
        }
        
        public void SetGrounded(bool grounded)
        {
            isGrounded = grounded;
        }
        
        public bool CanMove()
        {
            return !isInHitstun && !isDashing;
        }
        
        public bool CanJump()
        {
            return isGrounded && !isInHitstun;
        }
        
        public bool CanDash()
        {
            return !isDashing && !isInHitstun;
        }
        
        void OnCollisionEnter(Collision collision)
        {
            if (collision.gameObject.CompareTag("Ground"))
            {
                isGrounded = true;
            }
        }
        
        void OnCollisionExit(Collision collision)
        {
            if (collision.gameObject.CompareTag("Ground"))
            {
                isGrounded = false;
            }
        }
        
        void OnValidate()
        {
            if (Application.isPlaying)
            {
                currentHitstun = Mathf.Max(0, currentHitstun);
            }
        }
    }
}
