const IMAGES = {
  transactionIconPath: '../../../assets/images/wallet/transactionIcon.svg',
  walletCardBgPath: '../../../assets/images/wallet/cardBg.svg',
  kleoCoinPath: '../../../assets/images/wallet/kleoCoin.svg'
}

const WALLET_PAGE_DATA = {
  yourBalance: 'Your balance is',
  points: 1453,
  xpPoints: 'XP Points',
  transactions: [
    {
      title: 'Total Spent',
      value: 1146
    },
    {
      title: 'Total Recieved',
      value: 2599
    },
  ]
}

const pointsToString = (points: number | string): string => {
  const numericPoints = typeof points === 'string' ? parseFloat(points) : points;
  return numericPoints.toLocaleString('en-US');
};

export const Wallet = () => {
  return (
    <div className="h-[calc(100vh-70px)] w-full bg-grayblue-100 p-6 flex flex-col items-center gap-6">
      {/* Wallet Card */}
      <div
        className={`w-full flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 gap-6 text-white rounded-lg`}
        style={{
          backgroundImage: `url(${IMAGES.walletCardBgPath})`,
        }}
      >
        <div className="flex w-full flex-col gap-4 items-center">
          {/* title */}
          <h4 className="font-sans text-base font-medium">
            Your balance is
          </h4>
          {/* numbers */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={IMAGES.kleoCoinPath} alt="" className="size-10" />
              <h1 className="font-bold font-sans text-5xl">{pointsToString(1452)}</h1>
            </div>
            <h3 className="font-medium font-sans text-lg text-center">XP Points</h3>
          </div>
          {/* 2 cards */}
          <div className="flex justify-center w-full gap-6 flex-wrap">
            {WALLET_PAGE_DATA.transactions.map(transaction => (
              <StatCard
                title={transaction.title}
                value={transaction.value}
                key={transaction.title}
              />
            ))}
          </div>
        </div>
        {/* Withdraw button */}
        <div className="w-full px-4 py-3 bg-white hover:bg-white/80 cursor-pointer text-primary-700 text-center font-semibold text-lg rounded-xl">
          Withdraw Balance
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string,
  value: number,
}

const StatCard = ({ title, value }: StatCardProps) => {
  return (
    <div className="w-full max-w-40 h-fit rounded-md border border-white/50 bg-white/10 p-1 flex justify-start items-center gap-2">
      <div className="size-10 rounded-[4px] bg-white/10 flex justify-center items-center">
        <img src={IMAGES.transactionIconPath} alt="" className="size-6" />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-fit">
        <p className="font-medium text-[10px]">{title}</p>
        <p className="font-medium text-xs">
          <span className="font-bold text-xl">
            {pointsToString(value)}
          </span> XP
        </p>
      </div>
    </div>
  )
}