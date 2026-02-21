import MockPriceOracle from "../contracts/MockPriceOracle.cdc"

access(all) fun main(): UFix64 {
    return MockPriceOracle.getCurrentPrice()
}
