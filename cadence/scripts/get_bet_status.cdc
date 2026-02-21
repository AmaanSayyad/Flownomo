import OverflowGame from "../contracts/OverflowGame.cdc"

access(all) fun main(betId: UInt64): OverflowGame.BetStatusInfo? {
    return OverflowGame.getBetStatus(betId: betId)
}
