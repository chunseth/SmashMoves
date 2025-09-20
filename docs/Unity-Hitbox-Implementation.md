# Unity Hitbox Implementation for SmashMoves

## Overview
This guide explains how to implement hitboxes in Unity for the SmashMoves roguelike fighting game without animations, using a data-driven approach that integrates with your move builder system.

## Core Components

### 1. Move Data Structure
```csharp
[System.Serializable]
public class MoveData
{
    public string moveId;
    public string moveName;
    public MoveType moveType;
    public Rarity rarity;
    
    // Frame Data
    public int startupFrames;
    public int activeFrames;
    public int endLag;
    public int onShieldLag;
    
    // Damage Data
    public float damage;
    public int shieldStun;
    
    // Hitbox Data
    public HitboxData[] hitboxes;
    public string notes;
    public string[] links;
}

[System.Serializable]
public class HitboxData
{
    public int frame; // Which frame the hitbox becomes active
    public Vector3 offset; // Position relative to character
    public Vector3 size; // Hitbox dimensions
    public float angle; // Knockback angle
    public float baseKnockback;
    public float knockbackGrowth;
    public int hitstun;
    public bool canHitMultipleTimes;
    public string hitEffect; // Visual/audio effect name
}
```

### 2. Hitbox Controller
```csharp
public class HitboxController : MonoBehaviour
{
    [Header("Move Data")]
    public MoveData currentMove;
    
    [Header("Hitbox Objects")]
    public GameObject[] hitboxObjects; // Pre-created hitbox GameObjects
    
    [Header("Timing")]
    public int currentFrame = 0;
    public bool isActive = false;
    
    private Dictionary<int, List<HitboxData>> frameToHitboxes;
    private List<GameObject> activeHitboxes = new List<GameObject>();
    
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
        
        // Parse move data into frame-based dictionary
        frameToHitboxes = new Dictionary<int, List<HitboxData>>();
        foreach (var hitbox in currentMove.hitboxes)
        {
            if (!frameToHitboxes.ContainsKey(hitbox.frame))
                frameToHitboxes[hitbox.frame] = new List<HitboxData>();
            frameToHitboxes[hitbox.frame].Add(hitbox);
        }
    }
    
    void CreateHitboxObjects()
    {
        hitboxObjects = new GameObject[10]; // Max 10 hitboxes per move
        for (int i = 0; i < hitboxObjects.Length; i++)
        {
            GameObject hitbox = new GameObject($"Hitbox_{i}");
            hitbox.transform.SetParent(transform);
            
            // Add collider
            BoxCollider collider = hitbox.AddComponent<BoxCollider>();
            collider.isTrigger = true;
            
            // Add hitbox component
            Hitbox hitboxComponent = hitbox.AddComponent<Hitbox>();
            hitboxComponent.Initialize(this);
            
            // Add visual representation (optional)
            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Cube);
            visual.transform.SetParent(hitbox.transform);
            visual.transform.localScale = Vector3.one;
            visual.GetComponent<Collider>().enabled = false;
            visual.GetComponent<Renderer>().material.color = new Color(1, 0, 0, 0.3f);
            
            hitbox.SetActive(false);
            hitboxObjects[i] = hitbox;
        }
    }
    
    public void StartMove(MoveData move)
    {
        currentMove = move;
        currentFrame = 0;
        isActive = true;
        
        // Re-initialize hitboxes for new move
        InitializeHitboxes();
        
        // Start coroutine for frame-by-frame execution
        StartCoroutine(ExecuteMove());
    }
    
    IEnumerator ExecuteMove()
    {
        // Startup frames
        for (int i = 0; i < currentMove.startupFrames; i++)
        {
            yield return new WaitForFixedUpdate();
            currentFrame++;
        }
        
        // Active frames
        for (int i = 0; i < currentMove.activeFrames; i++)
        {
            UpdateHitboxes();
            yield return new WaitForFixedUpdate();
            currentFrame++;
        }
        
        // End lag
        for (int i = 0; i < currentMove.endLag; i++)
        {
            yield return new WaitForFixedUpdate();
            currentFrame++;
        }
        
        // Move complete
        isActive = false;
        DeactivateAllHitboxes();
    }
    
    void UpdateHitboxes()
    {
        // Deactivate all hitboxes first
        DeactivateAllHitboxes();
        
        // Activate hitboxes for current frame
        if (frameToHitboxes.ContainsKey(currentFrame))
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
        if (hitboxObj == null) return;
        
        // Configure hitbox
        Hitbox hitbox = hitboxObj.GetComponent<Hitbox>();
        hitbox.Configure(data);
        
        // Position and size
        hitboxObj.transform.localPosition = data.offset;
        hitboxObj.transform.localScale = data.size;
        
        // Activate
        hitboxObj.SetActive(true);
        activeHitboxes.Add(hitboxObj);
    }
    
    GameObject GetAvailableHitbox()
    {
        foreach (var hitbox in hitboxObjects)
        {
            if (!hitbox.activeInHierarchy)
                return hitbox;
        }
        return null;
    }
    
    void DeactivateAllHitboxes()
    {
        foreach (var hitbox in activeHitboxes)
        {
            hitbox.SetActive(false);
        }
        activeHitboxes.Clear();
    }
}
```

### 3. Individual Hitbox Component
```csharp
public class Hitbox : MonoBehaviour
{
    [Header("Hitbox Data")]
    public HitboxData data;
    
    [Header("References")]
    public HitboxController controller;
    
    private HashSet<GameObject> hitTargets = new HashSet<GameObject>();
    
    public void Initialize(HitboxController controller)
    {
        this.controller = controller;
    }
    
    public void Configure(HitboxData data)
    {
        this.data = data;
        hitTargets.Clear(); // Reset hit targets for new attack
    }
    
    void OnTriggerEnter(Collider other)
    {
        // Check if it's a valid target
        if (!IsValidTarget(other.gameObject)) return;
        
        // Check if we've already hit this target
        if (!data.canHitMultipleTimes && hitTargets.Contains(other.gameObject))
            return;
        
        // Apply hit
        ApplyHit(other.gameObject);
        hitTargets.Add(other.gameObject);
    }
    
    bool IsValidTarget(GameObject target)
    {
        // Check if target has health component or is an enemy
        return target.GetComponent<Health>() != null || 
               target.CompareTag("Enemy") || 
               target.CompareTag("Player");
    }
    
    void ApplyHit(GameObject target)
    {
        // Calculate knockback
        float knockback = CalculateKnockback(target);
        
        // Apply damage
        Health health = target.GetComponent<Health>();
        if (health != null)
        {
            health.TakeDamage(controller.currentMove.damage);
        }
        
        // Apply knockback
        Rigidbody rb = target.GetComponent<Rigidbody>();
        if (rb != null)
        {
            Vector3 knockbackDirection = CalculateKnockbackDirection(target);
            rb.AddForce(knockbackDirection * knockback, ForceMode.Impulse);
        }
        
        // Apply hitstun
        CharacterController charController = target.GetComponent<CharacterController>();
        if (charController != null)
        {
            charController.ApplyHitstun(data.hitstun);
        }
        
        // Play hit effect
        PlayHitEffect(target);
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
        direction.y = Mathf.Sin(data.angle * Mathf.Deg2Rad);
        direction.x = Mathf.Cos(data.angle * Mathf.Deg2Rad) * Mathf.Sign(direction.x);
        return direction;
    }
    
    void PlayHitEffect(GameObject target)
    {
        // Play hit effect based on data.hitEffect
        if (!string.IsNullOrEmpty(data.hitEffect))
        {
            // Instantiate hit effect at hit position
            GameObject effect = Instantiate(Resources.Load<GameObject>($"Effects/{data.hitEffect}"));
            effect.transform.position = target.transform.position;
        }
    }
}
```

## JSON Integration

### 4. Move Data Loader
```csharp
public class MoveDataLoader : MonoBehaviour
{
    [Header("Move Files")]
    public TextAsset moveDataFile;
    
    private Dictionary<string, MoveData> moveDatabase = new Dictionary<string, MoveData>();
    
    void Start()
    {
        LoadMoveData();
    }
    
    void LoadMoveData()
    {
        if (moveDataFile == null) return;
        
        try
        {
            MoveCollection collection = JsonUtility.FromJson<MoveCollection>(moveDataFile.text);
            
            foreach (var move in collection.moves)
            {
                moveDatabase[move.moveId] = move;
            }
            
            Debug.Log($"Loaded {moveDatabase.Count} moves from JSON");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Failed to load move data: {e.Message}");
        }
    }
    
    public MoveData GetMove(string moveId)
    {
        return moveDatabase.ContainsKey(moveId) ? moveDatabase[moveId] : null;
    }
    
    public List<MoveData> GetMovesByRarity(Rarity rarity)
    {
        return moveDatabase.Values.Where(m => m.rarity == rarity).ToList();
    }
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
```

## Enhanced JSON Format

### 5. Updated Move Format with Hitbox Data
```json
{
  "id": "forward-smash",
  "name": "Forward Smash",
  "type": "normal",
  "rarity": "rare",
  "startupFrames": 12,
  "activeFrames": 6,
  "endLag": 35,
  "onShieldLag": -15,
  "damage": 18.0,
  "shieldStun": 8,
  "notes": "Powerful forward smash attack. High knockback.",
  "links": ["jab-basic", "forward-tilt"],
  "hitboxes": [
    {
      "frame": 0,
      "offset": {"x": 1.5, "y": 0, "z": 0},
      "size": {"x": 2.0, "y": 1.5, "z": 1.0},
      "angle": 45,
      "baseKnockback": 15.0,
      "knockbackGrowth": 1.2,
      "hitstun": 20,
      "canHitMultipleTimes": false,
      "hitEffect": "smash_hit"
    },
    {
      "frame": 2,
      "offset": {"x": 2.0, "y": 0, "z": 0},
      "size": {"x": 2.5, "y": 1.8, "z": 1.2},
      "angle": 45,
      "baseKnockback": 18.0,
      "knockbackGrowth": 1.4,
      "hitstun": 25,
      "canHitMultipleTimes": false,
      "hitEffect": "smash_hit"
    }
  ],
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

## Implementation Benefits

### 1. **Data-Driven Design**
- Move properties defined in JSON
- Easy to balance and modify
- No code changes needed for new moves

### 2. **Frame-Perfect Timing**
- Hitboxes activate on exact frames
- Matches traditional fighting game precision
- Easy to debug and tune

### 3. **Modular System**
- Hitbox objects can be reused
- Easy to add new hitbox types
- Scalable for complex moves

### 4. **Visual Debugging**
- Hitboxes can be visualized in editor
- Frame-by-frame analysis
- Easy to see hitbox timing

### 5. **Integration Ready**
- Works with your move builder
- JSON format matches your existing system
- Easy to import/export moves

## Usage Example

```csharp
// In your character controller
public class PlayerController : MonoBehaviour
{
    public HitboxController hitboxController;
    public MoveDataLoader moveLoader;
    
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.A))
        {
            // Execute jab
            MoveData jab = moveLoader.GetMove("jab-basic");
            hitboxController.StartMove(jab);
        }
    }
}
```

This system provides a solid foundation for implementing hitboxes in Unity that integrates seamlessly with your move builder and maintains the precision needed for a fighting game.
