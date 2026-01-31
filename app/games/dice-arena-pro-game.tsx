'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from './game-context';
import { Coins, Plus, Minus, RotateCw, Wallet, Timer, History, ShieldCheck, Zap, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const getDiceIcon = (value: number, isRolling: boolean) => {
    const dotPositions: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
    };

    return (
        <div className={`w-16 h-16 bg-white rounded-xl grid grid-cols-3 p-2 gap-1 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.3)] relative transition-all duration-300 ${isRolling ? 'animate-bounce skew-x-12 skew-y-12' : ''}`}>
            {[...Array(9)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                    {dotPositions[value]?.includes(i) && (
                        <div className="w-2.5 h-2.5 bg-gray-900 rounded-full shadow-inner" />
                    )}
                </div>
            ))}
        </div>
    );
};

export const DiceArenaProGame: React.FC = () => {
    const { balance, setBalance, adminSettings, gameHistory, addGameLog } = useGame();
    const [betAmount, setBetAmount] = useState(500);
    const [bets, setBets] = useState<{ left: number; center: number; right: number }>({ left: 0, center: 0, right: 0 });
    const [timeLeft, setTimeLeft] = useState(adminSettings.roundTime);
    const [isRolling, setIsRolling] = useState(false);
    const [dice, setDice] = useState<[number, number]>([1, 1]);
    const [roundStatus, setRoundStatus] = useState<'betting' | 'locked' | 'result'>('betting');
    const [lastWinner, setLastWinner] = useState<'left' | 'center' | 'right' | null>(null);

    const betsRef = useRef(bets);
    useEffect(() => {
        betsRef.current = bets;
    }, [bets]);

    // Auto-game timer
    useEffect(() => {
        if (!adminSettings.isGameOn) return;

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    processResult();
                    return adminSettings.roundTime;
                }

                if (prev <= 3) {
                    setRoundStatus('locked');
                } else {
                    setRoundStatus('betting');
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [adminSettings.isGameOn, adminSettings.roundTime]);

    const processResult = () => {
        setIsRolling(true);
        setRoundStatus('result');

        // Simulate dice rolling animation
        let count = 0;
        const interval = setInterval(() => {
            setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
            count++;
            if (count >= 20) {
                clearInterval(interval);
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                const total = d1 + d2;

                let winner: 'left' | 'center' | 'right';
                if (total === 7) winner = 'center';
                else if (total < 7) winner = 'left';
                else winner = 'right';

                setDice([d1, d2]);
                setLastWinner(winner);
                setIsRolling(false);

                // Calculate payout using the ref to avoid stale closure
                const currentBets = betsRef.current;
                let winAmount = 0;
                if (winner === 'left') winAmount = currentBets.left * adminSettings.leftPayout;
                if (winner === 'center') winAmount = currentBets.center * adminSettings.centerPayout;
                if (winner === 'right') winAmount = currentBets.right * adminSettings.rightPayout;

                if (winAmount > 0) {
                    setBalance(prev => prev + winAmount);
                    toast.success(`WINNER! Total is ${total}. Payout: ₹${winAmount}`, {
                        className: "bg-primary border-primary text-primary-foreground font-black",
                    });
                } else if (currentBets.left > 0 || currentBets.center > 0 || currentBets.right > 0) {
                    toast.error(`LOSE! Total is ${total}. Winner: ${winner.toUpperCase()}`, {
                        className: "bg-destructive border-destructive text-white font-bold",
                    });
                }

                addGameLog({
                    id: Math.random().toString(36).substr(2, 9),
                    dice: [d1, d2],
                    total,
                    winner,
                    timestamp: new Date().toLocaleTimeString(),
                    totalBets: { ...currentBets }
                });

                // Reset bets for next round
                setBets({ left: 0, center: 0, right: 0 });
            }
        }, 80);
    };

    const placeBet = (box: 'left' | 'center' | 'right') => {
        if (roundStatus !== 'betting') {
            toast.warning("Bets are closed for this round!", {
                className: "bg-amber-500 border-amber-600 text-white font-bold",
            });
            return;
        }
        if (betAmount > balance) {
            toast.error("Insufficient balance!");
            return;
        }

        setBalance(prev => prev - betAmount);
        setBets(prev => ({ ...prev, [box]: prev[box] + betAmount }));
        toast.info(`₹${betAmount} bet placed on ${box.toUpperCase()}`, {
            className: "bg-blue-600 border-blue-700 text-white font-bold",
        });
    };

    const adjustBet = (amount: number) => {
        setBetAmount((prev) => Math.max(10, prev + amount));
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto w-full pb-12 animate-fadeIn">
            {/* Top Bar: Wallet, Timer, History */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-white/5 shadow-xl">
                    <div className="p-2 bg-accent/20 rounded-xl text-accent">
                        <Wallet size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Wallet</p>
                        <p className="text-lg font-black text-white tabular-nums">₹{balance.toLocaleString()}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 shadow-xl ${roundStatus === 'locked' ? 'bg-destructive/10 border-destructive animate-pulse' : 'bg-card border-white/5'}`}>
                    <div className={`p-2 rounded-xl ${roundStatus === 'locked' ? 'bg-destructive text-white' : 'bg-primary/20 text-primary'}`}>
                        <Timer size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{roundStatus === 'locked' ? 'Locked' : 'Coundown'}</p>
                        <p className={`text-xl font-black tabular-nums ${roundStatus === 'locked' ? 'text-destructive' : 'text-white'}`}>{timeLeft}s</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 p-4 bg-card rounded-2xl border border-white/5 shadow-xl">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                        <History size={18} />
                    </div>
                    <div className="flex gap-1 overflow-hidden">
                        {gameHistory.slice(0, 5).map((log, i) => (
                            <div
                                key={log.id}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${log.winner === 'center' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}
                            >
                                {log.total}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Dice Stage */}
            <div className="relative p-10 rounded-[3rem] bg-[#050b18] border-2 border-white/5 shadow-[0_0_80px_-20px_rgba(0,0,0,1)] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />

                {/* Dice Area */}
                <div className="flex flex-col items-center mb-12 relative z-10">
                    <div className={`flex gap-6 p-8 bg-card/50 rounded-[2.5rem] border-2 transition-all duration-500 ${isRolling ? 'border-accent scale-110 shadow-[0_0_40px_rgba(255,184,0,0.2)]' : 'border-white/5'}`}>
                        {getDiceIcon(dice[0], isRolling)}
                        {getDiceIcon(dice[1], isRolling)}
                    </div>
                    <div className="mt-6 flex flex-col items-center">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">Current Roll Sum</span>
                        <div className="text-5xl font-black text-white tracking-widest bg-[#0a1122] px-8 py-3 rounded-2xl border border-white/10 shadow-2xl min-w-[100px] text-center italic">
                            {isRolling ? '??' : dice[0] + dice[1]}
                        </div>
                    </div>
                </div>

                {/* 3 Betting Boxes */}
                <div className="grid grid-cols-3 gap-6 relative z-10">
                    {/* Small Box */}
                    <button
                        onClick={() => placeBet('left')}
                        disabled={roundStatus === 'locked' || isRolling}
                        className={`group relative flex flex-col items-center p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${lastWinner === 'left' && !isRolling ? 'border-primary ring-8 ring-primary/10 bg-primary/5' : 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50'
                            } ${bets.left > 0 ? 'ring-2 ring-blue-500/30 shadow-lg' : ''}`}
                    >
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 opacity-60">Small</span>
                        <h3 className="text-3xl font-black italic text-white mb-1">1 - 6</h3>
                        <div className="text-[10px] font-bold text-blue-400/80 mb-3 bg-blue-400/10 px-2 py-0.5 rounded-full uppercase">Pay {adminSettings.leftPayout}x</div>
                        {bets.left > 0 && (
                            <div className="mt-auto px-4 py-2 bg-blue-500 text-white text-xs font-black rounded-xl animate-in zoom-in">
                                ₹{bets.left}
                            </div>
                        )}
                    </button>

                    {/* Jackpot 7 Box */}
                    <button
                        onClick={() => placeBet('center')}
                        disabled={roundStatus === 'locked' || isRolling}
                        className={`group relative flex flex-col items-center p-6 rounded-[3rem] border-[3px] transition-all duration-500 transform hover:scale-105 ${lastWinner === 'center' && !isRolling ? 'border-accent ring-12 ring-accent/10 bg-accent/5' : 'border-accent/30 bg-accent/5 hover:border-accent shadow-[inset_0_0_20px_rgba(255,184,0,0.05)]'
                            } ${bets.center > 0 ? 'ring-4 ring-accent/30 shadow-2xl shadow-accent/20' : ''}`}
                    >
                        <div className="absolute -top-3 px-3 py-1 bg-accent text-accent-foreground font-black text-[9px] rounded-full uppercase tracking-tighter shadow-lg">Jackpot</div>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 opacity-60 mt-1">Single</span>
                        <h3 className="text-5xl font-black italic text-white mb-1 drop-shadow-lg">7</h3>
                        <div className="text-[10px] font-bold text-accent mb-3 bg-accent/10 px-2 py-0.5 rounded-full uppercase">Pay {adminSettings.centerPayout}x</div>
                        {bets.center > 0 && (
                            <div className="px-4 py-2 bg-accent text-accent-foreground text-xs font-black rounded-xl animate-in zoom-in shadow-lg">
                                ₹{bets.center}
                            </div>
                        )}
                    </button>

                    {/* Big Box */}
                    <button
                        onClick={() => placeBet('right')}
                        disabled={roundStatus === 'locked' || isRolling}
                        className={`group relative flex flex-col items-center p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${lastWinner === 'right' && !isRolling ? 'border-primary ring-8 ring-primary/10 bg-primary/5' : 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50'
                            } ${bets.right > 0 ? 'ring-2 ring-purple-500/30 shadow-lg' : ''}`}
                    >
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 opacity-60">Big</span>
                        <h3 className="text-3xl font-black italic text-white mb-1">8 - 12</h3>
                        <div className="text-[10px] font-bold text-purple-400/80 mb-3 bg-purple-400/10 px-2 py-0.5 rounded-full uppercase">Pay {adminSettings.rightPayout}x</div>
                        {bets.right > 0 && (
                            <div className="mt-auto px-4 py-2 bg-purple-500 text-white text-xs font-black rounded-xl animate-in zoom-in">
                                ₹{bets.right}
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Controls & Stake */}
            <div className="p-8 rounded-[3rem] bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-8 justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-white">
                            <Coins size={16} className="text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">Stake per Click</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => adjustBet(-100)}
                                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#0a1122] border border-white/10 hover:border-primary/50 text-white transition-all active:scale-90"
                            >
                                <Minus size={20} />
                            </button>
                            <div className="text-5xl font-black text-white tabular-nums tracking-tighter">₹{betAmount}</div>
                            <button
                                onClick={() => adjustBet(100)}
                                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:scale-105 transition-all active:scale-90 shadow-lg shadow-primary/20"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {[100, 500, 1000, 5000].map(val => (
                                <button key={val} onClick={() => setBetAmount(val)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${betAmount === val ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>₹{val}</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end gap-3 text-center sm:text-right max-w-xs">
                        {roundStatus === 'locked' ? (
                            <div className="flex flex-col items-center gap-2 animate-pulse">
                                <ShieldCheck size={32} className="text-destructive" />
                                <p className="text-sm font-black text-destructive uppercase tracking-widest">Bets Closed</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic leading-tight">Wait for the roll...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center sm:items-end gap-2">
                                <Zap size={32} className="text-primary" />
                                <p className="text-sm font-black text-primary uppercase tracking-widest">Active Round</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic leading-tight">Place your bets on the boxes above</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
