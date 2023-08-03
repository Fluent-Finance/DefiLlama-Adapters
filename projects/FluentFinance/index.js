// handcoded with 🤍 by 𝙆𝙊𝘿𝞝𝙋𝞸𝞝𝙏 <iam@kod3poet.dev>

// @ts-nocheck
// @ts-ignore
//
require('dotenv').config()

const sdk                    = require('@defillama/sdk');
const ethers                 = require('ethers');
const BigNumber              = require("bignumber.js")
const { unwrapUniswapV3LPs } = require('./helper');
const { stakingPricedLP }    = require('../helper/staking');
const { sumTokens2, nullAddress }         = require('../helper/unwrapLPs')

const ADDRESSES = require('../helper/coreAssets.json')

const FACTORY_ADDRESS     = process.env.FACTORY_ADDRESS;
const TOKEN_A_ADDRESS     = process.env.TOKEN_A_ADDRESS;
const TOKEN_B_ADDRESS     = process.env.TOKEN_B_ADDRESS;
const TOKEN_PAIR_POOL_500 = process.env.TOKEN_PAIR_POOL_500;
const LP_TOKEN_VAULT      = process.env.POSITION_MANAGER_ADDRESS;

const USDC_ADDRESS   = ADDRESSES.ethereum.USDC;
const TETHER_MAINNET = ADDRESSES.ethereum.USDT;
const MAINNET_POOL   = '0x73d4c165472d38ca879b7cbd4f5f7ab218d49086';
const MAINNET_TOKEN  = '0xe2e15a27fd732a96534b9797bf8091f3d9849831';
const TEST_WALLET    = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const OWNER_WALLET   = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const toUSDCBalaces = (amount, unitPrice) => ({
    [USDC_ADDRESS] : BigNumber(amount).dp(0, BigNumber.ROUND_DOWN).times(unitPrice).toFixed(0)
});

async function tvl(_, _1, _2, { api, block, timestamp }) {

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

  const uspBalance = await api.call({
    abi: 'erc20:balanceOf',
    target: MAINNET_TOKEN,
    params: [OWNER_WALLET],
  });

  const usdtBalance = await api.call({
    abi: 'erc20:balanceOf',
    target: ADDRESSES.ethereum.USDT,
    params: [OWNER_WALLET],
  });

  const pools       = [ TOKEN_PAIR_POOL_500, MAINNET_POOL ]
  const collaterals = [ [TOKEN_A_ADDRESS, TOKEN_B_ADDRESS], [MAINNET_TOKEN,ADDRESSES.ethereum.USDT] ]
  const toa         = collaterals.map((v,i) => ([v, pools[i]]))
  const ownerTokens = collaterals.map((v, i) => [v.filter(i => i !== nullAddress), pools[i]])

  console.log('TOA', toa)

  console.log(
    ethers.utils.formatEther(collateralBalance), 
    ethers.utils.formatEther(tokenBalance)
  );

  api.add(TOKEN_A_ADDRESS, collateralBalance);
  api.add(TOKEN_B_ADDRESS, tokenBalance);
  api.add(MAINNET_TOKEN,   uspBalance);
  api.add(ADDRESSES.ethereum.USDT,   usdtBalance);

  const sum = sumTokens2({ api, ownerTokens, resolveLP: true, resolveUniV3: true })
  return sum;
}

async function staking(timestamp, ethBlock, chainBlocks) {
  const balances = {};

  const collateralBalance = await sdk.api.abi.call({
    abi: 'erc20:balanceOf',
    target: TOKEN_A_ADDRESS,
    params: [TOKEN_PAIR_POOL_500],
  });

  const univ3_Positions = [{
    vault: TOKEN_A_ADDRESS,
    pool: TOKEN_PAIR_POOL_500
  }];

  console.log(ethBlock)
  console.log(collateralBalance)
  await unwrapUniswapV3LPs(balances, univ3_Positions, ethBlock, 'ethereum');
  const pool2 = await stakingPricedLP(TOKEN_A_ADDRESS, TOKEN_PAIR_POOL_500, "ethereum", TOKEN_PAIR_POOL_500, "weth", true); 

  return { FUSP: collateralBalance.output };  
}

async function pool2(timestamp, block) {
  let balances = {};

  const collateralBalance = (await sdk.api.abi.call({
    abi: 'erc20:balanceOf',
    target: TOKEN_A_ADDRESS,
    params: [TOKEN_PAIR_POOL_500],
  })).output;

  const lpBalance = (await sdk.api.erc20.balanceOf({
    target: LP_TOKEN_VAULT,
    owner: TOKEN_PAIR_POOL_500,
    block
  })).output;

  console.log(balances)

  return await Promise.resolve(balances);
}

module.exports = {
  methodology: "TVL Fluent Finance, capital locked for each pool plus protocolFees",
  timetravel: true,
  misrepresentedTokens: true,
  start: 1689033600,
  incentivized: true,
  ethereum: {
    tvl, 
    pool2,
    staking, 
  }
}
