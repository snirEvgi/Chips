import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Chip from './Chip';

const BettingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dealerIndex, setDealerIndex] = useState(0); // Track dealer position
  const [selectedChips, setSelectedChips] = useState([]);
  const [betHistory, setBetHistory] = useState([]);
  const [animateBet, setAnimateBet] = useState(false);
  const [totalPot, setTotalPot] = useState(0);
  const [gameStage, setGameStage] = useState('pre-flop'); // Stages: pre-flop, flop, turn, river
  const [highestBet, setHighestBet] = useState(0);
  const [maxBet, setMaxBet] = useState(100); // Default max bet limit
  
  // Chip denominations
  const chipValues = [1, 2, 5, 10, 25, 50];
  
  useEffect(() => {
    // Get players and game settings from router state or redirect to start screen
    if (location.state?.players) {
      setPlayers(location.state.players);
      // Initialize with player 0 as dealer and first player
      setDealerIndex(0);
      setCurrentPlayerIndex(0);
      
      // Get max bet limit if provided
      if (location.state.maxBet) {
        setMaxBet(location.state.maxBet);
      }
    } else {
      navigate('/');
    }
  }, [location, navigate]);
  
  // Advance to next poker stage
  const advanceStage = () => {
    switch(gameStage) {
      case 'pre-flop':
        setGameStage('flop');
        break;
      case 'flop':
        setGameStage('turn');
        break;
      case 'turn':
        setGameStage('river');
        break;
      case 'river':
        // Reset to pre-flop for a new hand
        handleEndRound();
        break;
      default:
        setGameStage('pre-flop');
    }
    
    // Add stage change to history
    const historyEntry = {
      id: betHistory.length,
      action: 'stage-change',
      stage: gameStage,
      nextStage: gameStage === 'river' ? 'new hand' : 
                (gameStage === 'pre-flop' ? 'flop' : 
                 gameStage === 'flop' ? 'turn' : 'river'),
      timestamp: new Date().toLocaleTimeString()
    };
    
    setBetHistory([historyEntry, ...betHistory]);
  };
  
  // Get current player
  const currentPlayer = players[currentPlayerIndex] || {};
  
  // Calculate current bet amount
  const currentBetAmount = selectedChips.reduce((sum, chip) => sum + chip, 0);
  
  // Calculate call amount for current player
  const calculateCallAmount = () => {
    // Get current player's existing bet
    const currentPlayerBet = players[currentPlayerIndex]?.currentBet || 0;
    return highestBet - currentPlayerBet;
  };
  
  // Current player call amount
  const callAmount = calculateCallAmount();
  
  // Check if current player can call
  const canCall = callAmount > 0;
  
  // Calculate remaining bet amount allowed for current player
  const calculateRemainingBetAllowed = () => {
    const currentPlayerBet = players[currentPlayerIndex]?.currentBet || 0;
    const currentAdditionalBet = selectedChips.reduce((sum, chip) => sum + chip, 0);
    return maxBet - (currentPlayerBet + currentAdditionalBet);
  };
  
  // Get remaining bet allowed
  const remainingBetAllowed = calculateRemainingBetAllowed();
  
  // Handle chip selection
  const handleChipClick = (value) => {
    // Check if adding this chip would exceed the max bet limit
    if (value <= remainingBetAllowed) {
      setSelectedChips([...selectedChips, value]);
      setAnimateBet(true);
      setTimeout(() => setAnimateBet(false), 300);
    } else {
      // Optionally: Animate to show the bet limit has been reached
      setAnimateBet(true);
      setTimeout(() => setAnimateBet(false), 600);
    }
  };
  
  // Handle removing a selected chip
  const handleRemoveChip = (index) => {
    const newSelectedChips = [...selectedChips];
    newSelectedChips.splice(index, 1);
    setSelectedChips(newSelectedChips);
  };
  
  // Handle Call (match the highest bet)
  const handleCall = () => {
    if (!canCall) return;
    
    // Update player's bet
    const updatedPlayers = [...players];
    const currentPlayerBet = updatedPlayers[currentPlayerIndex].currentBet || 0;
    const newTotalBet = highestBet;
    const amountAdded = newTotalBet - currentPlayerBet;
    
    updatedPlayers[currentPlayerIndex].currentBet = newTotalBet;
    
    // Update total pot
    setTotalPot(prev => prev + amountAdded);
    
    // Add to history
    const historyEntry = {
      id: betHistory.length,
      player: currentPlayer.name,
      action: 'called',
      amount: amountAdded,
      totalBet: newTotalBet,
      stage: gameStage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setBetHistory([historyEntry, ...betHistory]);
    setPlayers(updatedPlayers);
    
    // Move to next player
    setCurrentPlayerIndex((prevIndex) => 
      prevIndex >= players.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Handle raising (confirming bet)
  const handleRaise = () => {
    if (currentBetAmount === 0) return;
    
    // Update player's bet
    const updatedPlayers = [...players];
    const currentPlayerBet = updatedPlayers[currentPlayerIndex].currentBet || 0;
    const newTotalBet = currentPlayerBet + currentBetAmount;
    
    // Update highest bet if this raise is higher
    if (newTotalBet > highestBet) {
      setHighestBet(newTotalBet);
    }
    
    updatedPlayers[currentPlayerIndex].currentBet = newTotalBet;
    
    // Update total pot
    setTotalPot(prev => prev + currentBetAmount);
    
    // Add to history
    const historyEntry = {
      id: betHistory.length,
      player: currentPlayer.name,
      action: 'raised',
      amount: currentBetAmount,
      totalBet: newTotalBet,
      stage: gameStage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setBetHistory([historyEntry, ...betHistory]);
    setPlayers(updatedPlayers);
    setSelectedChips([]);
    
    // Move to next player
    setCurrentPlayerIndex((prevIndex) => 
      prevIndex >= players.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Handle end round
  const handleEndRound = () => {
    // Reset all bets
    setPlayers(players.map(player => ({ ...player, currentBet: 0 })));
    setBetHistory([]);
    setSelectedChips([]);
    setTotalPot(0);
    setHighestBet(0);
    setGameStage('pre-flop');
    
    // Rotate dealer position to the next player
    const newDealerIndex = (dealerIndex + 1) % players.length;
    setDealerIndex(newDealerIndex);
    
    // Set the player after the dealer as the starting player
    const newStartingPlayerIndex = (newDealerIndex + 1) % players.length;
    setCurrentPlayerIndex(newStartingPlayerIndex);
    
    // Add dealer change to history
    const dealerChangeEntry = {
      id: betHistory.length,
      action: 'dealer-change',
      oldDealer: players[dealerIndex]?.name || 'Player 1',
      newDealer: players[newDealerIndex]?.name || 'Player 2',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setBetHistory([dealerChangeEntry]);
  };
  
  // Handle new game
  const handleNewGame = () => {
    navigate('/');
  };

  if (players.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-poker-green">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-poker-green text-white flex flex-col">
      {/* Header */}
      <header className="bg-poker-black p-3 sm:p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold">Poker Chips Simulator</h1>
          <div className="flex justify-center w-full sm:w-auto">
            <div className="flex items-center justify-center bg-poker-black bg-opacity-60 px-4 py-2 rounded-md">
              <span className="text-sm sm:text-base font-medium mr-2">Stage:</span>
              <span className="text-sm sm:text-base font-bold text-yellow-400 capitalize">{gameStage}</span>
            </div>
          </div>
          <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto justify-center">
            <button 
              onClick={advanceStage}
              className="bg-yellow-600 hover:bg-yellow-700 px-2 sm:px-4 py-2 rounded-md transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              Next Stage
            </button>
            <button 
              onClick={handleEndRound}
              className="bg-poker-red hover:bg-red-700 px-2 sm:px-4 py-2 rounded-md transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              End Round
            </button>
            <button 
              onClick={handleNewGame}
              className="bg-poker-blue hover:bg-blue-700 px-2 sm:px-4 py-2 rounded-md transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              New Game
            </button>
          </div>
        </div>
      </header>
      
      {/* Total Pot Section */}
      <div className="bg-poker-black bg-opacity-80 py-3 shadow-lg">
        <div className="container mx-auto flex justify-center items-center">
          <div className="flex items-center">
            <span className="text-lg font-medium mr-3">Total Pot:</span>
            <span className="text-2xl sm:text-3xl font-bold text-poker-gold">{totalPot} chips</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 container mx-auto p-3 sm:p-4 flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left Column - Players & Current Bet */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 sm:gap-6">
          {/* Players List */}
          <div className="bg-poker-black bg-opacity-50 rounded-lg p-3 sm:p-4 shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Players</h2>
            <div className="space-y-2 sm:space-y-3">
              {players.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex justify-between items-center p-2 sm:p-3 rounded-md transition-colors ${
                    index === currentPlayerIndex 
                      ? 'bg-poker-blue bg-opacity-50 border-l-4 border-poker-blue' 
                      : 'bg-poker-black bg-opacity-30'
                  }`}
                >
                  <div className="flex items-center">
                    {/* Current player indicator */}
                    <span className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full mr-2 sm:mr-3 ${index === currentPlayerIndex ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                    
                    {/* Player name with dealer indicator */}
                    <div className="flex items-center">
                      <span className="font-medium text-sm sm:text-base">{player.name}</span>
                      {index === dealerIndex && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-600 text-white rounded-full">D</span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-sm sm:text-base">{player.currentBet} chips</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Current Bet */}
          <div className={`bg-poker-black bg-opacity-50 rounded-lg p-3 sm:p-4 shadow-lg ${animateBet ? 'animate-bounce-short' : ''}`}>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Current Bet</h2>
            
            {/* Bet limits indicators */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Highest bet indicator */}
              {highestBet > 0 && (
                <div className="bg-poker-black bg-opacity-30 rounded px-3 py-1 inline-block">
                  <span className="text-xs sm:text-sm text-gray-300">Highest bet: </span>
                  <span className="text-sm sm:text-base font-medium text-poker-gold">{highestBet} chips</span>
                </div>
              )}
              
              {/* Max bet indicator */}
              <div className="bg-poker-black bg-opacity-30 rounded px-3 py-1 inline-block">
                <span className="text-xs sm:text-sm text-gray-300">Max bet: </span>
                <span className="text-sm sm:text-base font-medium text-red-400">{maxBet} chips</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base sm:text-lg font-medium">{currentPlayer.name}'s turn</p>
                <div className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                  {currentBetAmount > 0 ? (
                    <span>{currentBetAmount} chips</span>
                  ) : currentPlayer.currentBet ? (
                    <span className="text-base sm:text-lg text-gray-400">Current: {currentPlayer.currentBet} chips</span>
                  ) : (
                    <span className="text-base sm:text-lg text-gray-400">No bet yet</span>
                  )}
                </div>
                
                {/* Remaining bet indicator */}
                <div className="text-xs sm:text-sm text-gray-300 mt-1">
                  {remainingBetAllowed > 0 ? (
                    <span>Remaining: <span className="text-green-400">{remainingBetAllowed} chips</span></span>
                  ) : (
                    <span className="text-red-400">Max bet limit reached</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row">
                {/* Call button */}
                {canCall && (
                  <button 
                    onClick={handleCall}
                    className="px-4 sm:px-5 py-2 rounded-md font-bold text-base sm:text-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Call ({callAmount})
                  </button>
                )}
                
                {/* Raise button */}
                <button 
                  onClick={handleRaise}
                  disabled={currentBetAmount === 0}
                  className={`px-4 sm:px-5 py-2 rounded-md font-bold text-base sm:text-lg transition-colors ${
                    currentBetAmount > 0 
                      ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  Raise
                </button>
              </div>
            </div>
            
            {/* Selected Chips */}
            {selectedChips.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-2">Selected Chips (click to remove):</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedChips.map((chip, index) => (
                    <div 
                      key={index}
                      onClick={() => handleRemoveChip(index)}
                      className={`chip chip-${chip} w-6 h-6 sm:w-8 sm:h-8 text-xs animate-slide-in hover:opacity-80 active:opacity-50`}
                      style={{animationDelay: `${index * 0.05}s`}}
                    >
                      {chip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Chip Selection & History */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 sm:gap-6">
          {/* Chip Selection */}
          <div className="bg-poker-black bg-opacity-50 rounded-lg p-3 sm:p-4 shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Chip Selection</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {chipValues.map(value => (
                <Chip 
                  key={value} 
                  value={value} 
                  onClick={() => handleChipClick(value)} 
                />
              ))}
            </div>
          </div>
          
          {/* Betting History */}
          <div className="bg-poker-black bg-opacity-50 rounded-lg p-3 sm:p-4 shadow-lg flex-1 overflow-hidden">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Betting History</h2>
            {betHistory.length === 0 ? (
              <p className="text-gray-400 italic text-sm sm:text-base">No actions yet</p>
            ) : (
              <div className="space-y-2 max-h-[250px] sm:max-h-[400px] overflow-y-auto pr-2">
                {betHistory.map(entry => {
                  // Handle stage change entries differently
                  if (entry.action === 'stage-change') {
                    return (
                      <div 
                        key={entry.id}
                        className="bg-yellow-900 bg-opacity-40 p-2 sm:p-3 rounded-md animate-slide-in"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm sm:text-base text-yellow-400 font-medium">Stage Change</span>
                          <span className="text-xs sm:text-sm text-gray-400">{entry.timestamp}</span>
                        </div>
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-300 capitalize">{entry.stage}</span>
                          <span className="mx-1">→</span>
                          <span className="text-yellow-400 font-medium capitalize">{entry.nextStage}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle dealer change entries
                  if (entry.action === 'dealer-change') {
                    return (
                      <div 
                        key={entry.id}
                        className="bg-blue-900 bg-opacity-40 p-2 sm:p-3 rounded-md animate-slide-in"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm sm:text-base text-blue-300 font-medium">Dealer Changed</span>
                          <span className="text-xs sm:text-sm text-gray-400">{entry.timestamp}</span>
                        </div>
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-300">{entry.oldDealer}</span>
                          <span className="mx-1">→</span>
                          <span className="text-blue-300 font-medium">{entry.newDealer}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  // Regular betting entries
                  return (
                    <div 
                      key={entry.id}
                      className="bg-poker-black bg-opacity-40 p-2 sm:p-3 rounded-md animate-slide-in"
                    >
                      <div className="flex justify-between">
                        <span className="text-sm sm:text-base font-medium">{entry.player}</span>
                        <span className="text-xs sm:text-sm text-gray-400">{entry.timestamp}</span>
                      </div>
                      <div className="text-xs sm:text-sm">
                        <span className="text-green-400">{entry.action} </span>
                        <span className="font-bold">{entry.amount} chips</span>
                        <span className="ml-1 text-gray-400 capitalize">({entry.stage})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingScreen;
