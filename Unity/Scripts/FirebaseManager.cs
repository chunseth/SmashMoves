using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Firebase;
using Firebase.Database;
using Firebase.Extensions;
using System.Threading.Tasks;

namespace SmashMoves
{
    public class FirebaseManager : MonoBehaviour
    {
        [Header("Firebase Configuration")]
        public string databaseUrl = "https://smashmoves-default-rtdb.firebaseio.com/";
        
        [Header("Debug")]
        public bool showDebugInfo = true;
        
        private DatabaseReference databaseReference;
        private bool isInitialized = false;
        
        // Events
        public System.Action<bool> OnFirebaseInitialized;
        public System.Action<MoveData> OnMoveLoaded;
        public System.Action<string> OnError;
        
        void Start()
        {
            InitializeFirebase();
        }
        
        async void InitializeFirebase()
        {
            try
            {
                // Initialize Firebase
                var dependencyStatus = await FirebaseApp.CheckAndFixDependenciesAsync();
                
                if (dependencyStatus == DependencyStatus.Available)
                {
                    // Initialize Realtime Database
                    databaseReference = FirebaseDatabase.GetInstance(databaseUrl).RootReference;
                    isInitialized = true;
                    
                    OnFirebaseInitialized?.Invoke(true);
                    
                    if (showDebugInfo)
                    {
                        Debug.Log("Firebase initialized successfully");
                    }
                }
                else
                {
                    Debug.LogError($"Could not resolve all Firebase dependencies: {dependencyStatus}");
                    OnFirebaseInitialized?.Invoke(false);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Firebase initialization failed: {e.Message}");
                OnFirebaseInitialized?.Invoke(false);
                OnError?.Invoke(e.Message);
            }
        }
        
        public async Task<bool> SaveMove(MoveData move)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return false;
            }
            
            try
            {
                string json = JsonUtility.ToJson(move);
                await databaseReference.Child("moves").Child(move.moveId).SetRawJsonValueAsync(json);
                
                if (showDebugInfo)
                {
                    Debug.Log($"Move saved to Firebase: {move.moveName}");
                }
                
                return true;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to save move: {e.Message}");
                OnError?.Invoke(e.Message);
                return false;
            }
        }
        
        public async Task<MoveData> LoadMove(string moveId)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return null;
            }
            
            try
            {
                var snapshot = await databaseReference.Child("moves").Child(moveId).GetValueAsync();
                
                if (snapshot.Exists)
                {
                    string json = snapshot.GetRawJsonValue();
                    MoveData move = JsonUtility.FromJson<MoveData>(json);
                    
                    if (showDebugInfo)
                    {
                        Debug.Log($"Move loaded from Firebase: {move.moveName}");
                    }
                    
                    OnMoveLoaded?.Invoke(move);
                    return move;
                }
                else
                {
                    Debug.LogWarning($"Move not found: {moveId}");
                    return null;
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load move: {e.Message}");
                OnError?.Invoke(e.Message);
                return null;
            }
        }
        
        public async Task<List<MoveData>> LoadAllMoves()
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return new List<MoveData>();
            }
            
            try
            {
                var snapshot = await databaseReference.Child("moves").GetValueAsync();
                List<MoveData> moves = new List<MoveData>();
                
                if (snapshot.Exists)
                {
                    foreach (var child in snapshot.Children)
                    {
                        string json = child.GetRawJsonValue();
                        MoveData move = JsonUtility.FromJson<MoveData>(json);
                        moves.Add(move);
                    }
                }
                
                if (showDebugInfo)
                {
                    Debug.Log($"Loaded {moves.Count} moves from Firebase");
                }
                
                return moves;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load moves: {e.Message}");
                OnError?.Invoke(e.Message);
                return new List<MoveData>();
            }
        }
        
        public async Task<List<MoveData>> LoadMovesByRarity(Rarity rarity)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return new List<MoveData>();
            }
            
            try
            {
                var snapshot = await databaseReference.Child("moves").OrderByChild("rarity").EqualTo(rarity.ToString()).GetValueAsync();
                List<MoveData> moves = new List<MoveData>();
                
                if (snapshot.Exists)
                {
                    foreach (var child in snapshot.Children)
                    {
                        string json = child.GetRawJsonValue();
                        MoveData move = JsonUtility.FromJson<MoveData>(json);
                        moves.Add(move);
                    }
                }
                
                if (showDebugInfo)
                {
                    Debug.Log($"Loaded {moves.Count} {rarity} moves from Firebase");
                }
                
                return moves;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load moves by rarity: {e.Message}");
                OnError?.Invoke(e.Message);
                return new List<MoveData>();
            }
        }
        
        public async Task<List<MoveData>> LoadMovesByType(MoveType type)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return new List<MoveData>();
            }
            
            try
            {
                var snapshot = await databaseReference.Child("moves").OrderByChild("moveType").EqualTo(type.ToString()).GetValueAsync();
                List<MoveData> moves = new List<MoveData>();
                
                if (snapshot.Exists)
                {
                    foreach (var child in snapshot.Children)
                    {
                        string json = child.GetRawJsonValue();
                        MoveData move = JsonUtility.FromJson<MoveData>(json);
                        moves.Add(move);
                    }
                }
                
                if (showDebugInfo)
                {
                    Debug.Log($"Loaded {moves.Count} {type} moves from Firebase");
                }
                
                return moves;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load moves by type: {e.Message}");
                OnError?.Invoke(e.Message);
                return new List<MoveData>();
            }
        }
        
        public async Task<bool> DeleteMove(string moveId)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return false;
            }
            
            try
            {
                await databaseReference.Child("moves").Child(moveId).RemoveValueAsync();
                
                if (showDebugInfo)
                {
                    Debug.Log($"Move deleted from Firebase: {moveId}");
                }
                
                return true;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to delete move: {e.Message}");
                OnError?.Invoke(e.Message);
                return false;
            }
        }
        
        public async Task<bool> UpdateMove(MoveData move)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return false;
            }
            
            try
            {
                string json = JsonUtility.ToJson(move);
                await databaseReference.Child("moves").Child(move.moveId).SetRawJsonValueAsync(json);
                
                if (showDebugInfo)
                {
                    Debug.Log($"Move updated in Firebase: {move.moveName}");
                }
                
                return true;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to update move: {e.Message}");
                OnError?.Invoke(e.Message);
                return false;
            }
        }
        
        public async Task<bool> SaveMoveCollection(MoveCollection collection)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return false;
            }
            
            try
            {
                string json = JsonUtility.ToJson(collection);
                await databaseReference.Child("collections").Child(collection.metadata.name).SetRawJsonValueAsync(json);
                
                if (showDebugInfo)
                {
                    Debug.Log($"Move collection saved to Firebase: {collection.metadata.name}");
                }
                
                return true;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to save move collection: {e.Message}");
                OnError?.Invoke(e.Message);
                return false;
            }
        }
        
        public async Task<MoveCollection> LoadMoveCollection(string collectionName)
        {
            if (!isInitialized)
            {
                Debug.LogError("Firebase not initialized");
                return null;
            }
            
            try
            {
                var snapshot = await databaseReference.Child("collections").Child(collectionName).GetValueAsync();
                
                if (snapshot.Exists)
                {
                    string json = snapshot.GetRawJsonValue();
                    MoveCollection collection = JsonUtility.FromJson<MoveCollection>(json);
                    
                    if (showDebugInfo)
                    {
                        Debug.Log($"Move collection loaded from Firebase: {collection.metadata.name}");
                    }
                    
                    return collection;
                }
                else
                {
                    Debug.LogWarning($"Move collection not found: {collectionName}");
                    return null;
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load move collection: {e.Message}");
                OnError?.Invoke(e.Message);
                return null;
            }
        }
        
        public bool IsInitialized()
        {
            return isInitialized;
        }
        
        public DatabaseReference GetDatabaseReference()
        {
            return databaseReference;
        }
    }
}
