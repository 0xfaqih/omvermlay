export interface MarketInfo {
  marketName: string;
  deploymentAddress: string;
}

export interface ClaimStatusError {
  status: 'error';
  reason: string;
}
export interface ClaimStatusSuccess {
  status: 'success';
  txHash: string;
}
export type ClaimStatus = ClaimStatusError | ClaimStatusSuccess;
export type ClaimStatusResponse = { [key: string]: ClaimStatus };