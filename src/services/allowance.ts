import { Wallet, Contract, parseUnits } from "ethers";
import ERC20_ABI from "../abis/erc20.json";

export async function ensureAllowance(
  wallet: Wallet,
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<void> {
  const token = new Contract(tokenAddress, ERC20_ABI as any, wallet);
  const parsedAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  const allowance: bigint = await token.allowance(wallet.address, spenderAddress);

  if (allowance < parsedAmount) {
    const tx = await token.approve(spenderAddress, parsedAmount);
    console.log(`[Allowance] Approve dikirim: ${tx.hash}`);
    await tx.wait();
    console.log(`[Allowance] Approve berhasil`);
  } else {
    console.log("[Allowance] Sudah cukup allowance, tidak perlu approve ulang.");
  }
}
