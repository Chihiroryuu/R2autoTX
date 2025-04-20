const ethers = require('ethers');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();
const { initializeWallet } = require('./utils/wallet');
const { stakeR2USD } = require('./utils/stake');
const { colorText, COLORS, EMOJI } = require('./utils/format');

const proxies = fs.readFileSync('proxies.txt', 'utf8').trim().split('\n');
const privateKeys = process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(',') : [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function showMenu(wallets) {
  console.log('\n');
  console.log(colorText('What would you like to do?', COLORS.CYAN));
  console.log(colorText('1. Stake R2USD', COLORS.YELLOW));
  console.log(colorText('2. Exit', COLORS.YELLOW));
  rl.question(colorText('Enter your choice: ', COLORS.WHITE), async (choice) => {
    switch (choice.trim()) {
      case '1':
        await handleStakeR2USD(wallets);
        break;
      case '2':
        rl.close();
        break;
      default:
        console.log(`${EMOJI.ERROR} ${colorText('Invalid choice, please try again.', COLORS.RED)}`);
        await showMenu(wallets);
        break;
    }
  });
}

async function handleStakeR2USD(walletList) {
  try {
    rl.question(`${colorText('Enter amount of R2USD to stake (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(walletList);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleStakeR2USD(walletList);
        return;
      }

      rl.question(`${colorText('Enter number of staking transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(walletList);
          return;
        }

        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleStakeR2USD(walletList);
          return;
        }

        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address}`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing staking transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} R2USD)`, COLORS.YELLOW)}`);
            const success = await stakeR2USD(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Staking transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Staking transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} staking transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }

        await showMenu(walletList);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during R2USD staking process:', COLORS.RED)}`, error);
    await showMenu(walletList);
  }
}

async function main() {
  try {
    console.log(colorText(`
██╗░░██╗███╗░░██╗████████╗██╗░░░░░██╗░░░██╗██╗░░██╗
██║░██╔╝████╗░██║╚══██╔══╝██║░░░░░██║░░░██║╚██╗██╔╝
█████═╝░██╔██╗██║░░░██║░░░██║░░░░░╚██╗░██╔╝░╚███╔╝░
██╔═██╗░██║╚████║░░░██║░░░██║░░░░░░╚████╔╝░░██╔██╗░
██║░╚██╗██║░╚███║░░░██║░░░███████╗░░╚██╔╝░░██╔╝╚██╗
╚═╝░░╚═╝╚═╝░░╚══╝░░░╚═╝░░░╚══════╝░░░╚═╝░░░╚═╝░░╚═╝
`, COLORS.RED));
    console.log(colorText('              Bot by Chihiroryuu - For Personal Use Only\n', COLORS.RED));

    console.log(`${EMOJI.INFO} ${colorText(`Loaded ${proxies.length} proxies from proxies.txt`, COLORS.GREEN)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Loaded ${privateKeys.length} private keys from .env`, COLORS.GREEN)}`);
    console.log(`${EMOJI.INFO} ${colorText('USDC/R2USD/sR2USD Bot Starting on Sepolia Testnet...', COLORS.GREEN)}`);

    const wallets = [];
    for (const privateKey of privateKeys) {
      try {
        const result = await initializeWallet(privateKey);
        wallets.push(result.wallet);
      } catch (error) {
        console.error(`${EMOJI.ERROR} ${colorText('Wallet initialization failed for a key.', COLORS.RED)}`);
      }
    }

    if (wallets.length === 0) {
      console.error(`${EMOJI.ERROR} ${colorText('No valid wallets initialized. Exiting.', COLORS.RED)}`);
      process.exit(1);
    }

    await showMenu(wallets);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred:', COLORS.RED)}`, error);
    rl.close();
  }
}

rl.on('close', () => {
  console.log(`${EMOJI.INFO} ${colorText('Application exited.', COLORS.GRAY)}`);
  process.exit(0);
});

main();
