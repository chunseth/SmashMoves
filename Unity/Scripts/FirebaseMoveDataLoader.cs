using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Threading.Tasks;
using System.Linq;

namespace SmashMoves
{
    public class FirebaseMoveDataLoader : MonoBehaviour
    {
        [Header("Firebase")]
        public FirebaseManager firebaseManager;
        
        [Header("Fallback")]
        public TextAsset localMoveDataFile;
        public bool useLocalFallback = true;
        
        [Header("Debug")]
        public bool showDebugInfo = true;
        
        private Dictionary<string, MoveData> moveDatabase = new Dictionary<string, MoveData>();
        private Dictionary<Rarity, List<MoveData>> movesByRarity = new Dictionary<Rarity, List<MoveData>>();
        private Dictionary<MoveType, List<MoveData>> movesByType = new Dictionary<MoveType, List<MoveData>>();
        
        // Events
        public System.Action<MoveData> OnMoveLoaded;
        public System.Action<int> OnAllMovesLoaded;
        public System.Action<string> OnError;
        
        void Start()
        {
            if (firebaseManager == null)
            {
                firebaseManager = FindObjectOfType<FirebaseManager>();
            }
            
            if (firebaseManager != null)
            {
                firebaseManager.OnFirebaseInitialized += OnFirebaseInitialized;
                firebaseManager.OnMoveLoaded += OnMoveLoaded;
                firebaseManager.OnError += OnError;
            }
            
            // Initialize dictionaries
            InitializeDictionaries();
        }
        
        void InitializeDictionaries()
        {
            movesByRarity.Clear();
            movesByType.Clear();
            
            foreach (Rarity rarity in System.Enum.GetValues(typeof(Rarity)))
            {
                movesByRarity[rarity] = new List<MoveData>();
            }
            
            foreach (MoveType type in System.Enum.GetValues(typeof(MoveType)))
            {
                movesByType[type] = new List<MoveData>();
            }
        }
        
        async void OnFirebaseInitialized(bool success)
        {
            if (success)
            {
                await LoadMovesFromFirebase();
            }
            else if (useLocalFallback)
            {
                LoadMovesFromLocal();
            }
        }
        
        async Task LoadMovesFromFirebase()
        {
            try
            {
                var moves = await firebaseManager.LoadAllMoves();
                
                foreach (var move in moves)
                {
                    AddMoveToDatabase(move);
                }
                
                if (showDebugInfo)
                {
                    Debug.Log($"Loaded {moveDatabase.Count} moves from Firebase");
                    Debug.Log($"Moves by rarity: {string.Join(", ", movesByRarity.Select(kvp => $"{kvp.Key}: {kvp.Value.Count}"))}");
                    Debug.Log($"Moves by type: {string.Join(", ", movesByType.Select(kvp => $"{kvp.Key}: {kvp.Value.Count}"))}");
                }
                
                OnAllMovesLoaded?.Invoke(moveDatabase.Count);
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load moves from Firebase: {e.Message}");
                OnError?.Invoke(e.Message);
                
                if (useLocalFallback)
                {
                    LoadMovesFromLocal();
                }
            }
        }
        
        void LoadMovesFromLocal()
        {
            if (localMoveDataFile == null)
            {
                Debug.LogError("No local move data file available");
                return;
            }
            
            try
            {
                MoveCollection collection = JsonUtility.FromJson<MoveCollection>(localMoveDataFile.text);
                
                if (collection.moves != null)
                {
                    foreach (var move in collection.moves)
                    {
                        if (ValidateMoveData(move))
                        {
                            AddMoveToDatabase(move);
                        }
                    }
                }
                
                if (showDebugInfo)
                {
                    Debug.Log($"Loaded {moveDatabase.Count} moves from local file");
                }
                
                OnAllMovesLoaded?.Invoke(moveDatabase.Count);
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load local move data: {e.Message}");
                OnError?.Invoke(e.Message);
            }
        }
        
        void AddMoveToDatabase(MoveData move)
        {
            moveDatabase[move.moveId] = move;
            movesByRarity[move.rarity].Add(move);
            movesByType[move.moveType].Add(move);
        }
        
        bool ValidateMoveData(MoveData move)
        {
            if (string.IsNullOrEmpty(move.moveId) || string.IsNullOrEmpty(move.moveName))
            {
                Debug.LogWarning($"Move missing ID or name: {move.moveName}");
                return false;
            }
            
            if (move.startupFrames < 0 || move.activeFrames < 0 || move.endLag < 0)
            {
                Debug.LogWarning($"Move {move.moveName} has invalid frame data");
                return false;
            }
            
            if (move.damage < 0)
            {
                Debug.LogWarning($"Move {move.moveName} has negative damage");
                return false;
            }
            
            return true;
        }
        
        public async Task<bool> SaveMoveToFirebase(MoveData move)
        {
            if (firebaseManager != null && firebaseManager.IsInitialized())
            {
                bool success = await firebaseManager.SaveMove(move);
                if (success)
                {
                    AddMoveToDatabase(move);
                }
                return success;
            }
            return false;
        }
        
        public async Task<bool> UpdateMoveInFirebase(MoveData move)
        {
            if (firebaseManager != null && firebaseManager.IsInitialized())
            {
                bool success = await firebaseManager.UpdateMove(move);
                if (success)
                {
                    // Update local database
                    moveDatabase[move.moveId] = move;
                    
                    // Update rarity and type lists
                    foreach (var rarityList in movesByRarity.Values)
                    {
                        rarityList.RemoveAll(m => m.moveId == move.moveId);
                    }
                    foreach (var typeList in movesByType.Values)
                    {
                        typeList.RemoveAll(m => m.moveId == move.moveId);
                    }
                    
                    movesByRarity[move.rarity].Add(move);
                    movesByType[move.moveType].Add(move);
                }
                return success;
            }
            return false;
        }
        
        public async Task<bool> DeleteMoveFromFirebase(string moveId)
        {
            if (firebaseManager != null && firebaseManager.IsInitialized())
            {
                bool success = await firebaseManager.DeleteMove(moveId);
                if (success)
                {
                    // Remove from local database
                    if (moveDatabase.ContainsKey(moveId))
                    {
                        MoveData move = moveDatabase[moveId];
                        moveDatabase.Remove(moveId);
                        movesByRarity[move.rarity].Remove(move);
                        movesByType[move.moveType].Remove(move);
                    }
                }
                return success;
            }
            return false;
        }
        
        public MoveData GetMove(string moveId)
        {
            return moveDatabase.ContainsKey(moveId) ? moveDatabase[moveId] : null;
        }
        
        public List<MoveData> GetMovesByRarity(Rarity rarity)
        {
            return movesByRarity.ContainsKey(rarity) ? new List<MoveData>(movesByRarity[rarity]) : new List<MoveData>();
        }
        
        public List<MoveData> GetMovesByType(MoveType type)
        {
            return movesByType.ContainsKey(type) ? new List<MoveData>(movesByType[type]) : new List<MoveData>();
        }
        
        public List<MoveData> GetMovesByRarityAndType(Rarity rarity, MoveType type)
        {
            var rarityMoves = GetMovesByRarity(rarity);
            return rarityMoves.Where(m => m.moveType == type).ToList();
        }
        
        public List<MoveData> GetAllMoves()
        {
            return new List<MoveData>(moveDatabase.Values);
        }
        
        public List<MoveData> GetRandomMoves(int count, Rarity? rarity = null, MoveType? type = null)
        {
            List<MoveData> candidateMoves;
            
            if (rarity.HasValue && type.HasValue)
            {
                candidateMoves = GetMovesByRarityAndType(rarity.Value, type.Value);
            }
            else if (rarity.HasValue)
            {
                candidateMoves = GetMovesByRarity(rarity.Value);
            }
            else if (type.HasValue)
            {
                candidateMoves = GetMovesByType(type.Value);
            }
            else
            {
                candidateMoves = GetAllMoves();
            }
            
            return candidateMoves.OrderBy(x => Random.value).Take(count).ToList();
        }
        
        public List<MoveData> GetMovesThatLinkFrom(string moveId)
        {
            return moveDatabase.Values.Where(m => m.links != null && m.links.Contains(moveId)).ToList();
        }
        
        public List<MoveData> GetMovesThatLinkTo(string moveId)
        {
            var move = GetMove(moveId);
            if (move == null || move.links == null) return new List<MoveData>();
            
            return move.links.Select(linkId => GetMove(linkId)).Where(linkedMove => linkedMove != null).ToList();
        }
        
        public bool HasMove(string moveId)
        {
            return moveDatabase.ContainsKey(moveId);
        }
        
        public int GetMoveCount()
        {
            return moveDatabase.Count;
        }
        
        public int GetMoveCountByRarity(Rarity rarity)
        {
            return movesByRarity.ContainsKey(rarity) ? movesByRarity[rarity].Count : 0;
        }
        
        public int GetMoveCountByType(MoveType type)
        {
            return movesByType.ContainsKey(type) ? movesByType[type].Count : 0;
        }
        
        public List<MoveData> GetDraftPool(int poolSize, Rarity[] allowedRarities = null, MoveType[] allowedTypes = null)
        {
            List<MoveData> draftPool = new List<MoveData>();
            
            if (allowedRarities == null)
                allowedRarities = System.Enum.GetValues(typeof(Rarity)).Cast<Rarity>().ToArray();
            
            if (allowedTypes == null)
                allowedTypes = System.Enum.GetValues(typeof(MoveType)).Cast<MoveType>().ToArray();
            
            foreach (var rarity in allowedRarities)
            {
                foreach (var type in allowedTypes)
                {
                    var moves = GetMovesByRarityAndType(rarity, type);
                    draftPool.AddRange(moves);
                }
            }
            
            return draftPool.OrderBy(x => Random.value).Take(poolSize).ToList();
        }
        
        public List<MoveData> GetComboOptions(string currentMoveId, int maxOptions = 3)
        {
            var comboOptions = GetMovesThatLinkFrom(currentMoveId);
            return comboOptions.OrderBy(x => Random.value).Take(maxOptions).ToList();
        }
        
        void OnDestroy()
        {
            if (firebaseManager != null)
            {
                firebaseManager.OnFirebaseInitialized -= OnFirebaseInitialized;
                firebaseManager.OnMoveLoaded -= OnMoveLoaded;
                firebaseManager.OnError -= OnError;
            }
        }
    }
}
