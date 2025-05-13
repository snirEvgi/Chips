import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StartScreen = () => {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState(Array(4).fill('').map((_, i) => ({ id: i, name: '' })));
  const [maxBet, setMaxBet] = useState(100); // Default max bet of 100 chips
  
  const handleCountChange = (count) => {
    setPlayerCount(count);
  };
  
  const handleNameChange = (id, name) => {
    setPlayers(prev => prev.map(player => 
      player.id === id ? { ...player, name } : player
    ));
  };
  
  const handleStartGame = () => {
    const activePlayers = players.slice(0, playerCount).map(p => ({ 
      ...p, 
      name: p.name.trim() || `Player ${p.id + 1}`,
      currentBet: 0
    }));
    
    // Navigate to betting screen with player data and max bet setting
    navigate('/betting', { state: { players: activePlayers, maxBet } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-poker-green p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-center text-poker-black mb-8">Poker Chips Simulator</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Number of Players</h2>
          <div className="flex justify-between">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => handleCountChange(num)}
                className={`py-2 px-6 rounded-full text-lg font-medium transition-all ${
                  playerCount === num
                    ? 'bg-poker-blue text-white shadow-md transform scale-105'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Player Names</h2>
          <div className="space-y-3">
            {players.slice(0, playerCount).map((player) => (
              <div key={player.id} className="flex items-center">
                <span className="w-24 font-medium">Player {player.id + 1}</span>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(player.id, e.target.value)}
                  placeholder={`Player ${player.id + 1}`}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-poker-blue focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Max Bet Limit</h2>
          <div className="flex items-center">
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={maxBet}
              onChange={(e) => setMaxBet(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-4 text-xl font-bold min-w-[80px] text-center text-poker-blue">{maxBet}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Maximum bet allowed per player per round</p>
        </div>
        
        <button
          onClick={handleStartGame}
          className="w-full py-3 bg-poker-blue hover:bg-blue-700 text-white font-bold rounded-md shadow-md transition-colors animate-bounce-short"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
