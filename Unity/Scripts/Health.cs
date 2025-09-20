using UnityEngine;

namespace SmashMoves
{
    public class Health : MonoBehaviour
    {
        [Header("Health Settings")]
        public float maxHealth = 100f;
        public float currentHealth;
        public float damagePercent = 0f;
        
        [Header("Debug")]
        public bool showDebugInfo = false;
        
        // Events
        public System.Action<float> OnHealthChanged;
        public System.Action<float> OnDamageTaken;
        public System.Action OnDeath;
        
        void Start()
        {
            currentHealth = maxHealth;
            UpdateDamagePercent();
        }
        
        public void TakeDamage(float damage)
        {
            if (damage <= 0) return;
            
            currentHealth = Mathf.Max(0, currentHealth - damage);
            UpdateDamagePercent();
            
            OnDamageTaken?.Invoke(damage);
            OnHealthChanged?.Invoke(currentHealth);
            
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} took {damage} damage. Health: {currentHealth}/{maxHealth}");
            }
            
            if (currentHealth <= 0)
            {
                OnDeath?.Invoke();
                if (showDebugInfo)
                {
                    Debug.Log($"{gameObject.name} has died!");
                }
            }
        }
        
        public void Heal(float amount)
        {
            if (amount <= 0) return;
            
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            UpdateDamagePercent();
            
            OnHealthChanged?.Invoke(currentHealth);
            
            if (showDebugInfo)
            {
                Debug.Log($"{gameObject.name} healed {amount}. Health: {currentHealth}/{maxHealth}");
            }
        }
        
        public void SetHealth(float health)
        {
            currentHealth = Mathf.Clamp(health, 0, maxHealth);
            UpdateDamagePercent();
            
            OnHealthChanged?.Invoke(currentHealth);
        }
        
        public float GetHealthPercent()
        {
            return currentHealth / maxHealth;
        }
        
        public float GetDamagePercent()
        {
            return damagePercent;
        }
        
        public bool IsAlive()
        {
            return currentHealth > 0;
        }
        
        void UpdateDamagePercent()
        {
            damagePercent = (maxHealth - currentHealth) / maxHealth * 100f;
        }
        
        void OnValidate()
        {
            if (Application.isPlaying)
            {
                currentHealth = Mathf.Clamp(currentHealth, 0, maxHealth);
                UpdateDamagePercent();
            }
        }
    }
}
