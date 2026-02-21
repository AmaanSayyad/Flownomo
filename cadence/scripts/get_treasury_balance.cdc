import OverflowGame from "../contracts/OverflowGame.cdc"

access(all) fun main(): UFix64 {
    return OverflowGame.getTreasuryBalance()
}
