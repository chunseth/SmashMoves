using System.Collections.Generic;
using UnityEngine;

namespace SmashMoves
{
    public class Hitbox : MonoBehaviour
    {
        [Header("Hitbox Data")]
        public HitboxData data;
        
        [Header("References")]
        public HitboxController controller;
        
        [Header("Debug")]
        public bool showDebugInfo = false;
        
        private HashSet<GameObject> hitTargets = new HashSet<GameObject>();
        private List<GameObject> currentFrameTargets = new List<GameObject>();
        
        // Events
        public System.Action<GameObject, HitboxData> OnHit;
        public System.Action<GameObject, HitboxData> OnBlock;
        
        public void Initialize(HitboxController controller)
        {
            this.controller = controller;
        }
        
        public void Configure(HitboxData data)
        {
            this.data = data;
            hitTargets.Clear(); // Reset hit targets for new attack
            currentFrameTargets.Clear();
        }
        
        void OnTriggerEnter(Collider other)
        {
            // Check if it's a valid target
            if (!IsValidTarget(other.gameObject)) return;
            
            // Check if we've already hit this target this frame
            if (currentFrameTargets.Contains(other.gameObject)) return;
            
            // Check if we've already hit this target (for multi-hit moves)
            if (!data.canHitMultipleTimes && hitTargets.Contains(other.gameObject))
                return;
            
            // Add to current frame targets
            currentFrameTargets.Add(other.gameObject);
            
            // Apply hit
            ApplyHit(other.gameObject);
            
            // Add to hit targets
            hitTargets.Add(other.gameObject);
        }
        
        void OnTriggerStay(Collider other)
        {
            // Handle continuous hitboxes (like projectiles)
            if (data.isProjectile && IsValidTarget(other.gameObject))
            {
                if (!currentFrameTargets.Contains(other.gameObject))
                {
                    OnTriggerEnter(other);
                }
            }
        }
        
        void LateUpdate()
        {
            // Clear current frame targets for next frame
            currentFrameTargets.Clear();
        }
        
        bool IsValidTarget(GameObject target)
        {
            // Check if target has health component or is an enemy/player
            return target.GetComponent<Health>() != null || 
                   target.CompareTag("Enemy") || 
                   target.CompareTag("Player") ||
                   target.GetComponent<CharacterController>() != null;
        }
        
        void ApplyHit(GameObject target)
        {
            // Check if target is blocking
            bool isBlocking = IsTargetBlocking(target);
            
            if (isBlocking)
            {
                ApplyBlock(target);
            }
            else
            {
                ApplyDamage(target);
            }
            
            // Play hit effect
            PlayHitEffect(target, isBlocking);
            
            // Trigger events
            if (isBlocking)
            {
                OnBlock?.Invoke(target, data);
            }
            else
            {
                OnHit?.Invoke(target, data);
            }
            
            if (showDebugInfo)
            {
                Debug.Log($"Hitbox hit {target.name} for {data.baseKnockback} knockback (Blocking: {isBlocking})");
            }
        }
        
        bool IsTargetBlocking(GameObject target)
        {
            // Check if target has a shield component and is actively blocking
            Shield shield = target.GetComponent<Shield>();
            if (shield != null && shield.IsBlocking())
            {
                // Check if hitbox is hitting the shield from the front
                Vector3 directionToTarget = (target.transform.position - transform.position).normalized;
                Vector3 targetForward = target.transform.forward;
                
                float dot = Vector3.Dot(directionToTarget, targetForward);
                return dot > 0.5f; // Hit from front
            }
            
            return false;
        }
        
        void ApplyDamage(GameObject target)
        {
            // Apply damage
            Health health = target.GetComponent<Health>();
            if (health != null)
            {
                health.TakeDamage(controller.currentMove.damage);
            }
            
            // Calculate knockback
            float knockback = CalculateKnockback(target);
            Vector3 knockbackDirection = CalculateKnockbackDirection(target);
            
            // Apply knockback
            Rigidbody rb = target.GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.AddForce(knockbackDirection * knockback, ForceMode.Impulse);
            }
            
            // Apply hitstun
            CharacterController charController = target.GetComponent<CharacterController>();
            if (charController != null)
            {
                charController.ApplyHitstun(data.hitstun);
            }
        }
        
        void ApplyBlock(GameObject target)
        {
            // Apply shield damage (reduced)
            Health health = target.GetComponent<Health>();
            if (health != null)
            {
                float shieldDamage = controller.currentMove.damage * 0.1f; // 10% damage through shield
                health.TakeDamage(shieldDamage);
            }
            
            // Apply shield stun
            Shield shield = target.GetComponent<Shield>();
            if (shield != null)
            {
                shield.ApplyShieldStun(controller.currentMove.shieldStun);
            }
            
            // Apply reduced knockback
            float knockback = CalculateKnockback(target) * 0.3f; // 30% knockback through shield
            Vector3 knockbackDirection = CalculateKnockbackDirection(target);
            
            Rigidbody rb = target.GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.AddForce(knockbackDirection * knockback, ForceMode.Impulse);
            }
        }
        
        float CalculateKnockback(GameObject target)
        {
            Health health = target.GetComponent<Health>();
            if (health == null) return data.baseKnockback;
            
            float damagePercent = health.GetDamagePercent();
            return data.baseKnockback + (data.knockbackGrowth * damagePercent);
        }
        
        Vector3 CalculateKnockbackDirection(GameObject target)
        {
            Vector3 direction = (target.transform.position - transform.position).normalized;
            
            // Apply angle
            float angleRad = data.angle * Mathf.Deg2Rad;
            direction.y = Mathf.Sin(angleRad);
            direction.x = Mathf.Cos(angleRad) * Mathf.Sign(direction.x);
            direction.z = 0; // 2D fighting game
            
            return direction.normalized;
        }
        
        void PlayHitEffect(GameObject target, bool isBlocking)
        {
            if (string.IsNullOrEmpty(data.hitEffect)) return;
            
            string effectName = isBlocking ? $"{data.hitEffect}_block" : data.hitEffect;
            
            // Try to instantiate hit effect
            GameObject effectPrefab = Resources.Load<GameObject>($"Effects/{effectName}");
            if (effectPrefab != null)
            {
                GameObject effect = Instantiate(effectPrefab);
                effect.transform.position = target.transform.position;
                
                // Auto-destroy effect after 2 seconds
                Destroy(effect, 2f);
            }
            else
            {
                // Fallback: create simple particle effect
                CreateSimpleHitEffect(target.transform.position, isBlocking);
            }
        }
        
        void CreateSimpleHitEffect(Vector3 position, bool isBlocking)
        {
            // Create a simple particle effect
            GameObject effect = new GameObject("HitEffect");
            effect.transform.position = position;
            
            ParticleSystem particles = effect.AddComponent<ParticleSystem>();
            var main = particles.main;
            main.startColor = isBlocking ? Color.blue : Color.yellow;
            main.startSize = 0.5f;
            main.startLifetime = 0.5f;
            main.maxParticles = 20;
            
            var emission = particles.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[]
            {
                new ParticleSystem.Burst(0.0f, 20)
            });
            
            // Auto-destroy
            Destroy(effect, 2f);
        }
        
        void OnDrawGizmos()
        {
            if (data == null) return;
            
            Gizmos.color = Color.red;
            Gizmos.matrix = transform.localToWorldMatrix;
            Gizmos.DrawWireCube(Vector3.zero, Vector3.one);
            
            // Draw knockback direction
            Gizmos.color = Color.yellow;
            Vector3 knockbackDir = new Vector3(
                Mathf.Cos(data.angle * Mathf.Deg2Rad),
                Mathf.Sin(data.angle * Mathf.Deg2Rad),
                0
            );
            Gizmos.DrawRay(Vector3.zero, knockbackDir * 2f);
        }
    }
}
