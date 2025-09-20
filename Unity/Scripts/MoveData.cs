using System;
using System.Collections.Generic;
using UnityEngine;

namespace SmashMoves
{
    [System.Serializable]
    public enum MoveType
    {
        Normal,
        Special,
        Movement,
        Finisher,
        Utility
    }

    [System.Serializable]
    public enum Rarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    [System.Serializable]
    public class MoveData
    {
        [Header("Basic Info")]
        public string moveId;
        public string moveName;
        public MoveType moveType;
        public Rarity rarity;
        
        [Header("Frame Data")]
        public int startupFrames;
        public int activeFrames;
        public int endLag;
        public int onShieldLag;
        
        [Header("Damage Data")]
        public float damage;
        public int shieldStun;
        
        [Header("Hitbox Data")]
        public HitboxData[] hitboxes;
        
        [Header("Additional Info")]
        public string notes;
        public string[] links;
        public string createdAt;
    }

    [System.Serializable]
    public class HitboxData
    {
        [Header("Timing")]
        public int frame; // Which frame the hitbox becomes active (relative to move start)
        
        [Header("Position & Size")]
        public Vector3 offset; // Position relative to character
        public Vector3 size; // Hitbox dimensions
        
        [Header("Knockback")]
        public float angle; // Knockback angle in degrees
        public float baseKnockback;
        public float knockbackGrowth;
        
        [Header("Hit Properties")]
        public int hitstun;
        public bool canHitMultipleTimes;
        public string hitEffect; // Visual/audio effect name
        
        [Header("Advanced")]
        public bool isProjectile; // For projectile moves
        public float projectileSpeed; // Speed for projectile hitboxes
        public float projectileLifetime; // How long projectile exists
    }

    [System.Serializable]
    public class MoveCollection
    {
        public string formatVersion;
        public string description;
        public MoveMetadata metadata;
        public MoveData[] moves;
    }

    [System.Serializable]
    public class MoveMetadata
    {
        public string name;
        public string author;
        public string version;
        public string description;
        public string createdAt;
        public int totalMoves;
    }
}
