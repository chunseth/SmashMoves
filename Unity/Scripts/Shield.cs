using UnityEngine;

namespace SmashMoves
{
    public class Shield : MonoBehaviour
    {
        [Header("Shield Settings")]
        public float maxShieldHealth = 100f;
        public float currentShieldHealth;
        public float shieldRegenRate = 10f;
        public float shieldRegenDelay = 1f;
        
        [Header("Shield Stun")]
        public int currentShieldStun = 0;
        public bool isBlocking = false;
        
        [Header("Debug")]
        public bool showDebugInfo = false;
        
        private float lastDamageTime;
        private bool canRegen = true;
        
        // Events
        public System.Action<float> OnShieldHealthChanged;
        public System.Action OnShieldBroken;
        public System.Action OnShieldRestored;
        
        void Start()
        {
            currentShieldHealth = maxShieldHealth;
        }
        
        void Update()
        {
            // Handle shield regeneration
            if (canRegen && currentShieldHealth < maxShieldHealth)
            {
                if (Time.time - lastDamageTime >= shieldRegenDelay)
                {
                    RegenerateShield();
                }
            }
            
            // Handle shield stun
            if (currentShieldStun > 0)
            {
                currentShieldStun--;
                if (currentShieldStun <= 0)
                {
                    currentShieldStun = 0;
                }
            }
        }
        
        public void StartBlocking()
        {
            if (currentShieldHealth > 0)
            {
                isBlocking = true;
                if (showDebugInfo)
                {
                    Debug.Log($"{gameObject.name} started blocking");
                }
            }
        }
        
        public void StopBlocking()
        {
            isBlocking = false;
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} stopped blocking");
            }
        }
        
        public bool IsBlocking()
        {
            return isBlocking && currentShieldHealth > 0 && currentShieldStun <= 0;
        }
        
        public void TakeShieldDamage(float damage)
        {
            if (damage <= 0) return;
            
            currentShieldHealth = Mathf.Max(0, currentShieldHealth - damage);
            lastDamageTime = Time.time;
            canRegen = false;
            
            OnShieldHealthChanged?.Invoke(currentShieldHealth);
            
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} shield took {damage} damage. Shield: {currentShieldHealth}/{maxShieldHealth}");
            }
            
            if (currentShieldHealth <= 0)
            {
                OnShieldBroken?.Invoke();
                isBlocking = false;
                if (showDebugInfo)
                {
                    Debug.Log($"{gameObject.name} shield broken!");
                }
            }
        }
        
        public void ApplyShieldStun(int frames)
        {
            currentShieldStun = Mathf.Max(currentShieldStun, frames);
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} shield stunned for {frames} frames");
            }
        }
        
        void RegenerateShield()
        {
            float regenAmount = shieldRegenRate * Time.deltaTime;
            currentShieldHealth = Mathf.Min(maxShieldHealth, currentShieldHealth + regenAmount);
            
            OnShieldHealthChanged?.Invoke(currentShieldHealth);
            
            if (currentShieldHealth >= maxShieldHealth)
            {
                OnShieldRestored?.Invoke();
                if (showDebugInfo)
                {
                    Debug.Log($"{gameObject.name} shield fully restored");
                }
            }
        }
        
        public float GetShieldPercent()
        {
            return currentShieldHealth / maxShieldHealth;
        }
        
        public bool IsShieldBroken()
        {
            return currentShieldHealth <= 0;
        }
        
        public bool CanBlock()
        {
            return currentShieldHealth > 0 && currentShieldStun <= 0;
        }
        
        void OnValidate()
        {
            if (Application.isPlaying)
            {
                currentShieldHealth = Mathf.Clamp(currentShieldHealth, 0, maxShieldHealth);
            }
        }
    }
}
