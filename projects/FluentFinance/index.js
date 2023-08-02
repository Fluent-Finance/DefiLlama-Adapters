// handcoded with 🤍 by 𝙆𝙊𝘿𝞝𝙋𝞸𝞝𝙏 <iam@kod3poet.dev>

require('dotenv').config()

const sdk                    = require('@defillama/sdk');
const ethers                 = require('ethers');
const BigNumber              = require("bignumber.js")
const { unwrapUniswapV3LPs } = require('./helper');
const { stakingPricedLP }    = require('../helper/staking');
const { getUniTVL }          = require('../helper/unknownTokens')
const { log }                = require('../helper/utils')


const FACTORY_ADDRESS     = process.env.FACTORY_ADDRESS;
const TOKEN_A_ADDRESS     = process.env.TOKEN_A_ADDRESS;
const TOKEN_B_ADDRESS     = process.env.TOKEN_B_ADDRESS;
const TOKEN_PAIR_POOL_500 = process.env.TOKEN_PAIR_POOL_500;

async function tvl(_, _1, _2, { api }) {

    console.log('calc TVL')

    const collateralBalance = await api.call({
      abi: 'erc20:balanceOf',
      target: TOKEN_A_ADDRESS,
      params: [TOKEN_PAIR_POOL_500],
    });

    const tokenBalance = await api.call({
      abi: 'erc20:balanceOf',
      target: TOKEN_B_ADDRESS,
      params: [TOKEN_PAIR_POOL_500],
    });

    console.log(
      ethers.utils.formatEther(collateralBalance), 
      ethers.utils.formatEther(tokenBalance)
    );

    api.add(TOKEN_A_ADDRESS, collateralBalance);
    api.add(TOKEN_B_ADDRESS, tokenBalance);
}

async function staking(timestamp, ethBlock, chainBlocks) {
  const balances = {};

  const univ3_Positions = [{
    vault: TOKEN_A_ADDRESS,
    pool: TOKEN_PAIR_POOL_500
  }];

  console.log(ethBlock)
  await unwrapUniswapV3LPs(balances, univ3_Positions, ethBlock, 'ethereum');
  const pool2 = await stakingPricedLP(TOKEN_A_ADDRESS, TOKEN_PAIR_POOL_500, "ethereum", TOKEN_PAIR_POOL_500, "weth", true); 
  console.log(pool2)

  return balances;
}


module.exports = {
  methodology: "TVL Fluent Finance, capital locked for each pool plus protocolFees",
  timetravel: true,
  misrepresentedTokens: true,
  start: 1689033600,
  ethereum: {
    tvl, 
    staking, 
  }
}
