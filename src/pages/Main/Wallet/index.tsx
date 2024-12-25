// src/pages/Main/Wallet/index.tsx

import { useEffect, useState, useContext } from 'react';
import { vanaWalletApi } from '../../../../background/utils/api';
import { UserContext } from '../../../common/hooks/UserContext';
const IMAGES = {
  transactionIconPath: '../../../assets/images/wallet/transactionIcon.svg',
  walletCardBgPath: '../../../assets/images/wallet/cardBg.svg',
  kleoCoinPath: '../../../assets/images/wallet/kleoCoin.svg',
  spendIconPath: '../../../assets/images/wallet/spendIcon.svg',
  incomeIconPath: '../../../assets/images/wallet/incomeIcon.svg',
  linkIconPath: '../../../assets/images/wallet/linkIcon.svg'
};

const pointsToString = (points: number | string): string => {
  const numericPoints = typeof points === 'string' ? parseFloat(points) : points;
  return numericPoints.toLocaleString('en-US');
};

interface StatCardProps {
  title: string,
  value: number,
  type: "INCOME" | "OUTGO",
}

const StatCard = ({ title, value, type }: StatCardProps) => {
  return (
    <div className="h-fit flex-1 rounded-md border border-white/50 bg-white/10 p-1 flex justify-start items-center gap-2">
      <div className="size-10 rounded-[4px] bg-white/10 flex justify-center items-center">
        <img src={type === 'INCOME' ? IMAGES.incomeIconPath : IMAGES.spendIconPath} alt="" className="size-[22px]" />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-fit">
        <p className="font-medium text-[10px]">{title}</p>
        <p className="font-medium text-xs">
          <span className="font-bold text-xl">{pointsToString(value)}</span> XP
        </p>
      </div>
    </div>
  )
}

interface TransactionCardProps {
  type: 'INCOME' | 'OUTGO',
  desc: string,
  date: string,
  amount: number,
  hash: string
}

export const TransactionCard = ({ amount, date, desc, type, hash }: TransactionCardProps) => {
  return (
    <div className="bg-white rounded-lg w-full flex justify-between gap-4 px-4 py-2">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1">
          <a
            href={`https://islander.vanascan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
            title="View Transaction"
          >
            <img src={IMAGES.linkIconPath} className="size-4" />
            <h3 className="font-medium text-sm">{desc}</h3>

          </a>
        </div>
        <p className="text-[10px] leading-tight text-gray-500">{date}</p>
      </div>
      <div className={`font-bold text-xs ${type === 'INCOME' ? 'text-[#12B76A]' : 'text-[#F97066]'}`}>
        <span className="font-semibold text-sm">{type === 'INCOME' ? '+' : '-'} {pointsToString(amount)}</span> XP
      </div>
    </div>
  )
}

export const Wallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Array<{ type: 'INCOME' | 'OUTGO', desc: string, date: string, amount: number, hash: string }>>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [totalReceived, setTotalReceived] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true); // Added loading state

  const { user } = useContext(UserContext);
  const userAddress = user?.address;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Balance
        const balances = await vanaWalletApi('GET', `/addresses/${userAddress}/token-balances`);
        const rawBalance = balances[0]?.value ?? '0';
        const decimals = parseInt(balances[0]?.token?.decimals || '18', 10);
        const humanReadableBalance = Number(rawBalance) / Math.pow(10, decimals);
        setBalance(humanReadableBalance);

        // Fetch Transactions
        const transfersResponse = await vanaWalletApi('GET', `/addresses/${userAddress}/token-transfers?type=ERC-20%2CERC-721%2CERC-1155&filter=to%20%7C%20from&token=0xf23E379b2fd945F8c0A4F410Cb6EF9398bf022D6`);
        const transferItems = transfersResponse.items || [];

        let spent = 0;
        let received = 0;
        const txs = transferItems.map((item: any) => {
          const decimals = parseInt(item.token.decimals || '18', 10);
          const amount = Number(item.total.value) / Math.pow(10, decimals);
          const isOutgoing = (item.from.hash.toLowerCase() === userAddress.toLowerCase());
          const isIncoming = (item.to.hash.toLowerCase() === userAddress.toLowerCase());

          let type: 'INCOME' | 'OUTGO' = 'INCOME';
          let desc = '';

          if (isOutgoing) {
            type = 'OUTGO';
            spent += amount;
            desc = `Transferred out to ${item.to.hash.slice(0, 6)}...${item.to.hash.slice(-4)}`;
          } else if (isIncoming) {
            type = 'INCOME';
            received += amount;
            if (item.from.hash === '0x0000000000000000000000000000000000000000') {
              desc = 'Minted to your wallet';
            } else {
              desc = `Received from ${item.from.hash.slice(0, 6)}...${item.from.hash.slice(-4)}`;
            }
          }

          const dateObj = new Date(item.timestamp);
          const dateStr = dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          return {
            type,
            desc,
            date: dateStr,
            amount,
            hash: item.transaction_hash
          };
        });

        setTransactions(txs);
        setTotalSpent(spent);
        setTotalReceived(received);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        // Once all data is fetched, turn off the loading state
        setLoading(false);
      }
    }

    fetchData();
  }, []);


  return (
    <div className="h-[calc(100vh-52px)] w-full bg-grayblue-100 p-6 flex flex-col items-center gap-3 overflow-auto">
      {/* Show loading bar or spinner if loading is true */}
      {loading ? (
        <div className="w-full flex justify-center items-center flex-col gap-4">
          {/* Example: Simple Loading Bar or Spinner */}
          <div className="w-1/2 bg-white/50 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-600 h-full animate-pulse"></div>
          </div>
          <p className="text-gray-500 text-sm">Loading data, please wait...</p>
        </div>
      ) : (
        <>
          {/* Wallet Card */}
          <div
            className="w-full flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 gap-6 text-white rounded-lg"
            style={{
              backgroundImage: `url(${IMAGES.walletCardBgPath})`,
            }}
          >
            <div className="flex w-full flex-col gap-4 items-center">
              {/* title */}
              <h4 className="font-sans text-sm font-medium">
                Your balance is
              </h4>
              {/* numbers */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <img src={IMAGES.kleoCoinPath} alt="" className="size-10" />
                  <h1 className="font-bold font-sans text-5xl">{pointsToString(balance)}</h1>
                </div>
                <h3 className="font-medium font-sans text-lg text-center">ACT Token</h3>
              </div>
              {/* 2 cards */}
              <div className="flex justify-center w-full max-w-md gap-4 flex-wrap">
                <StatCard
                  title="Total Spent"
                  value={totalSpent}
                  type="OUTGO"
                />
                <StatCard
                  title="Total Received"
                  value={totalReceived}
                  type="INCOME"
                />
              </div>
            </div>
            {/* Withdraw button */}
            {/* <div className="w-full max-w-md px-4 py-3 bg-white hover:bg-white/80 cursor-pointer text-primary-700 text-center font-semibold text-lg rounded-xl">
              Withdraw Balance
            </div> */}
          </div>
          {/* Title + Description */}
          <div className="w-full flex flex-col gap-1 font-sans">
            <h1 className="font-bold text-xl">Recent Transactions</h1>
            <p className="text-xs">Displays maximum of last 10 previous transactions.</p>
          </div>
          {/* Previous Transactions */}
          <div className="flex flex-col gap-4 w-full">
            {transactions.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">No Transactions found</div>
            ) : (
              transactions.map((transaction, index) => (
                <TransactionCard
                  key={index}
                  amount={transaction.amount}
                  date={transaction.date}
                  desc={transaction.desc}
                  type={transaction.type}
                  hash={transaction.hash}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
