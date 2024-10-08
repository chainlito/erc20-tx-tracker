const dotenv = require("dotenv");
const { ethers, BigNumber } = require("ethers");

dotenv.config();

const etherscanProvider = new ethers.providers.EtherscanProvider("homestead", process.env.ETHERSCAN_API_KEY);
const uniswapRouter = process.env.UNISWAP_ROUTER;
const swapEventTopic = ethers.utils.id('Swap(address,uint256,uint256,uint256,uint256,address)');
const swapInterface = new ethers.utils.Interface(['event Swap (address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)']);
const addressList = process.env.ADDRESS_LIST.split(",");

const main = async () => {
    let totalAmount = BigNumber.from(0);
    let totalBoughtWallets = 0;

    for (let address of addressList) {
        console.log(`------------${address}---------`);
        const history = await etherscanProvider.getHistory(address);

        for (let tx of history) {
            if (tx.from.toLowerCase() === address.toLowerCase() && 
            tx.to.toLowerCase() === uniswapRouter.toLowerCase()) {
                const receipt = await etherscanProvider.getTransactionReceipt(tx.hash);
                const swapLogs = receipt.logs.filter(log => log.topics[0] === swapEventTopic);
                
                // take the last swap event
                const lastSwapEvent = swapLogs.slice(-1)[0]
                
                // decode the data
            
                const parsed = swapInterface.parseLog(lastSwapEvent);
                
                // use the non zero value
                const receivedTokens = parsed.args.amount0Out.isZero() ?  parsed.args.amount1Out : parsed.args.amount0Out;
                console.log(`${address}: ${ethers.utils.formatUnits(receivedTokens, 9)}`);
                totalAmount = totalAmount.add(receivedTokens);
                totalBoughtWallets ++;
            }
        }
    };
    
    console.log(`Total Balance: ${ethers.utils.formatUnits(totalAmount, 9)}`);
    console.log(`${totalBoughtWallets} wallets bought of ${addressList.length} wallets`);
}

main();
