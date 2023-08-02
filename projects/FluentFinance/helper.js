// handcoded with 🤍 by 𝙆𝙊𝘿𝞝𝙋𝞸𝞝𝙏 <iam@kod3poet.dev>

const sdk                     = require("@defillama/sdk")
const ethers                  = require('ethers');
const BigNumber               = require("bignumber.js")
const { unwrapUniswapV3NFTs } = require("../helper/unwrapLPs");
const { log }                 = require('../helper/utils')

const unwrapUniswapV3LPs = async (
  balances, 
  univ3_Positions, 
  block, 
  chain = 'ethereum', 
  transformAddress = (addr) => addr) => {

  return await Promise.all(
    univ3_Positions.map(async (univ3_Position) => {

      try {

        // Get share of that LP as balanceOf / totalSupply
        const { output: totalSupply } = await sdk.api.abi.call({
          block,
          abi: 'erc20:totalSupply',
          target: univ3_Position.vault,
          chain
        }); console.log('totalSupply', ethers.utils.formatEther(totalSupply));

        const { output: heldLPshares } = await sdk.api.abi.call({
          block,
          abi: 'erc20:balanceOf',
          target: univ3_Position.vault,
          params: univ3_Position.pool,
          chain
        }); console.log('heldLP', ethers.utils.formatEther(heldLPshares));

        const sharesRatio = (heldLPshares / totalSupply);
        console.log('sharesRatio', sharesRatio)

        const positionBalances = 
          await unwrapUniswapV3NFTs({ 
            chain, block, owner: univ3_Position.pool 
          });


        console.log('positionBal', positionBalances);
        // Add balances while multiplying 
        // amount by ratio of shares
        Object
          .entries(positionBalances)
          .forEach(async entry => {
            const [key, value] = entry;
            sdk.util.sumSingleBalance(
              balances, 
              await transformAddress(key), 
              BigNumber(sharesRatio * value).toFixed(0)
            );
          }
        );

        console.log('positionBal', positionBalances);
      } catch (e) {
        console.log(`Failed to get data for LP token vault at ${univ3_Position.vault} on chain ${chain}`)
        throw e;
      }
    })
  );
}

module.exports = {
  unwrapUniswapV3LPs
}
