using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace SmashMoves
{
    public class MoveDataLoader : MonoBehaviour
    {
        [Header("Move Files")]
        public TextAsset moveDataFile;
        public TextAsset[] additionalMoveFiles;
        
        [Header("Debug")]
        public bool showDebugInfo = true;
        
        private Dictionary<string, MoveData> moveDatabase = new Dictionary<string, MoveData>();
        private Dictionary<Rarity, List<MoveData>> movesByRarity = new Dictionary<Rarity, List<MoveData>>();
        private Dictionary<MoveType, List<MoveData>> movesByType = new Dictionary<MoveType, List<MoveData>>();
        
        // Events
        public System.Action<MoveData> OnMoveLoaded;
        public System.Action<int> OnAllMovesLoaded;
        
        void Start()
        {
            LoadMoveData();
        }
        
        public void LoadMoveData()
        {
            moveDatabase.Clear();
            movesByRarity.Clear();
            movesByType.Clear();
            
            // Initialize rarity and type dictionaries
            foreach (Rarity rarity in System.Enum.GetValues(typeof(Rarity)))
            {
                movesByRarity[rarity] = new List<MoveData>();
            }
            
            foreach (MoveType type in System.Enum.GetValues(typeof(MoveType)))
            {
                movesByType[type] = new List<MoveData>();
            }
            
            // Load main move file
            if (moveDataFile != null)
            {
                LoadFromTextAsset(moveDataFile);
            }
            
            // Load additional move files
            if (additionalMoveFiles != null)
            {
                foreach (var file in additionalMoveFiles)
                {
                    if (file != null)
                    {
                        LoadFromTextAsset(file);
                    }
                }
            }
            
            if (showDebugInfo)
            {
                Debug.Log($"Loaded {moveDatabase.Count} moves from JSON files");
                Debug.Log($"Moves by rarity: {string.Join(", ", movesByRarity.Select(kvp => $"{kvp.Key}: {kvp.Value.Count}"))}");
                Debug.Log($"Moves by type: {string.Join(", ", movesByType.Select(kvp => $"{kvp.Key}: {kvp.Value.Count}"))}");
            }
            
            OnAllMovesLoaded?.Invoke(moveDatabase.Count);
        }
        
        void LoadFromTextAsset(TextAsset textAsset)
        {
            try
            {
                MoveCollection collection = JsonUtility.FromJson<MoveCollection>(textAsset.text);
                
                if (collection.moves != null)
                {
                    foreach (var move in collection.moves)
                    {
                        if (ValidateMoveData(move))
                        {
                            moveDatabase[move.moveId] = move;
                            movesByRarity[move.rarity].Add(move);
                            movesByType[move.moveType].Add(move);
                            
                            OnMoveLoaded?.Invoke(move);
                        }
                        else
                        {
                            Debug.LogWarning($"Invalid move data for {move.moveName}, skipping...");
                        }
                    }
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load move data from {textAsset.name}: {e.Message}");
            }
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
            
            // Validate hitbox data
            if (move.hitboxes != null)
            {
                foreach (var hitbox in move.hitboxes)
                {
                    if (hitbox.frame < 0 || hitbox.frame >= (move.startupFrames + move.activeFrames))
                    {
                        Debug.LogWarning($"Move {move.moveName} has hitbox on invalid frame {hitbox.frame}");
                        return false;
                    }
                }
            }
            
            return true;
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
            
            // Shuffle and return requested count
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
        
        // For roguelike draft system
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
            
            // Shuffle and return requested pool size
            return draftPool.OrderBy(x => Random.value).Take(poolSize).ToList();
        }
        
        // For combo system
        public List<MoveData> GetComboOptions(string currentMoveId, int maxOptions = 3)
        {
            var comboOptions = GetMovesThatLinkFrom(currentMoveId);
            return comboOptions.OrderBy(x => Random.value).Take(maxOptions).ToList();
        }
        
        void OnValidate()
        {
            // Validate in editor
            if (moveDataFile != null && Application.isPlaying)
            {
                LoadMoveData();
            }
        }
    }
}
