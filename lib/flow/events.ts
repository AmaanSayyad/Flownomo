/**
 * Flow event listeners for Overflow game
 */

import * as fcl from "@onflow/fcl";

/**
 * Event emitted when a bet is placed
 */
export interface BetPlacedEvent {
  betId: string;
  player: string;
  amount: string;
  targetCellId: string;
  priceChange: string;
  direction: string;
  multiplier: string;
  startPrice: string;
  startTime: string;
  endTime: string;
}

/**
 * Event emitted when a round is settled
 */
export interface RoundSettledEvent {
  betId: string;
  player: string;
  won: boolean;
  actualPriceChange: string;
  payout: string;
  startPrice: string;
  endPrice: string;
  timestamp: string;
}

/**
 * Event emitted when a payout is transferred
 */
export interface PayoutTransferredEvent {
  betId: string;
  recipient: string;
  amount: string;
  timestamp: string;
}

/**
 * Event emitted when the game is paused
 */
export interface GamePausedEvent {
  timestamp: string;
}

/**
 * Event emitted when the game is resumed
 */
export interface GameResumedEvent {
  timestamp: string;
}

/**
 * Subscribe to bet-related events from the OverflowGame contract
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param onBetPlaced - Callback function when a bet is placed
 * @param onRoundSettled - Callback function when a round is settled
 * @param onPayoutTransferred - Optional callback function when a payout is transferred
 * @returns Unsubscribe function to stop listening to events
 */
export const subscribeToBetEvents = (
  contractAddress: string,
  onBetPlaced: (event: BetPlacedEvent) => void,
  onRoundSettled: (event: RoundSettledEvent) => void,
  onPayoutTransferred?: (event: PayoutTransferredEvent) => void
): (() => void) => {
  // Remove 0x prefix if present
  const cleanAddress = contractAddress.replace(/^0x/, '');
  
  // Subscribe to BetPlaced events
  const betPlacedUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.BetPlaced`)
    .subscribe((event: any) => {
      try {
        const eventData = event.data;
        onBetPlaced({
          betId: eventData.betId,
          player: eventData.player,
          amount: eventData.amount,
          targetCellId: eventData.targetCellId,
          priceChange: eventData.priceChange,
          direction: eventData.direction,
          multiplier: eventData.multiplier,
          startPrice: eventData.startPrice,
          startTime: eventData.startTime,
          endTime: eventData.endTime
        });
      } catch (error) {
        console.error('Error processing BetPlaced event:', error);
      }
    });
  
  // Subscribe to RoundSettled events
  const roundSettledUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.RoundSettled`)
    .subscribe((event: any) => {
      try {
        const eventData = event.data;
        onRoundSettled({
          betId: eventData.betId,
          player: eventData.player,
          won: eventData.won,
          actualPriceChange: eventData.actualPriceChange,
          payout: eventData.payout,
          startPrice: eventData.startPrice,
          endPrice: eventData.endPrice,
          timestamp: eventData.timestamp
        });
      } catch (error) {
        console.error('Error processing RoundSettled event:', error);
      }
    });
  
  // Subscribe to PayoutTransferred events if callback provided
  let payoutTransferredUnsubscribe: (() => void) | undefined;
  if (onPayoutTransferred) {
    payoutTransferredUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.PayoutTransferred`)
      .subscribe((event: any) => {
        try {
          const eventData = event.data;
          onPayoutTransferred({
            betId: eventData.betId,
            recipient: eventData.recipient,
            amount: eventData.amount,
            timestamp: eventData.timestamp
          });
        } catch (error) {
          console.error('Error processing PayoutTransferred event:', error);
        }
      });
  }
  
  // Return unsubscribe function that cleans up all subscriptions
  return () => {
    betPlacedUnsubscribe();
    roundSettledUnsubscribe();
    if (payoutTransferredUnsubscribe) {
      payoutTransferredUnsubscribe();
    }
  };
};

/**
 * Subscribe to game state events (pause/resume)
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param onGamePaused - Callback function when the game is paused
 * @param onGameResumed - Callback function when the game is resumed
 * @returns Unsubscribe function to stop listening to events
 */
export const subscribeToGameStateEvents = (
  contractAddress: string,
  onGamePaused: (event: GamePausedEvent) => void,
  onGameResumed: (event: GameResumedEvent) => void
): (() => void) => {
  // Remove 0x prefix if present
  const cleanAddress = contractAddress.replace(/^0x/, '');
  
  // Subscribe to GamePaused events
  const gamePausedUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.GamePaused`)
    .subscribe((event: any) => {
      try {
        const eventData = event.data;
        onGamePaused({
          timestamp: eventData.timestamp
        });
      } catch (error) {
        console.error('Error processing GamePaused event:', error);
      }
    });
  
  // Subscribe to GameResumed events
  const gameResumedUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.GameResumed`)
    .subscribe((event: any) => {
      try {
        const eventData = event.data;
        onGameResumed({
          timestamp: eventData.timestamp
        });
      } catch (error) {
        console.error('Error processing GameResumed event:', error);
      }
    });
  
  // Return unsubscribe function that cleans up all subscriptions
  return () => {
    gamePausedUnsubscribe();
    gameResumedUnsubscribe();
  };
};

/**
 * Poll for events from a specific block height
 * Useful for fetching historical events or when real-time subscriptions are not available
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param eventType - The event type to poll (e.g., 'BetPlaced', 'RoundSettled')
 * @param fromBlockHeight - Starting block height to poll from
 * @param toBlockHeight - Ending block height to poll to (optional, defaults to 'latest')
 * @returns Promise resolving to array of events
 */
export const pollEvents = async (
  contractAddress: string,
  eventType: string,
  fromBlockHeight: string | number,
  toBlockHeight?: string | number
): Promise<any[]> => {
  try {
    // Remove 0x prefix if present
    const cleanAddress = contractAddress.replace(/^0x/, '');
    
    // Get current block height if using 'latest'
    let fromBlock: number;
    let toBlock: number;
    
    if (fromBlockHeight === 'latest') {
      const block = await fcl.send([fcl.getBlock(true)]).then(fcl.decode);
      fromBlock = block.height;
    } else {
      fromBlock = Number(fromBlockHeight);
    }
    
    if (toBlockHeight === 'latest' || !toBlockHeight) {
      const block = await fcl.send([fcl.getBlock(true)]).then(fcl.decode);
      toBlock = block.height;
    } else {
      toBlock = Number(toBlockHeight);
    }
    
    const events = await fcl.send([
      fcl.getEventsAtBlockHeightRange(
        `A.${cleanAddress}.OverflowGame.${eventType}`,
        fromBlock,
        toBlock
      )
    ]).then(fcl.decode);
    
    return events;
  } catch (error) {
    console.error(`Error polling ${eventType} events:`, error);
    return [];
  }
};
