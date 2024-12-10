const IMAGES = {
  transactionIconPath: '../../../assets/images/wallet/transactionIcon.svg',
  walletCardBgPath: '../../../assets/images/wallet/cardBg.svg',
  kleoCoinPath: '../../../assets/images/wallet/kleoCoin.svg',
  spendIconPath: '../../../assets/images/wallet/spendIcon.svg',
  incomeIconPath: '../../../assets/images/wallet/incomeIcon.svg'
}

const WALLET_PAGE_DATA = {
  yourBalance: 'Your balance is',
  points: 1453,
  xpPoints: 'XP Points',
  transactionCards: [
    {
      title: 'Total Spent',
      value: 1146,
      type: 'OUTGO'
    },
    {
      title: 'Total Recieved',
      value: 2599,
      type: 'INCOME'
    },
  ],
  title: "Previous Transactions",
  desc: 'Select your task and sit back as your personal ai assistant take over.',
  transactions: [
    {
      type: 'OUTGO',
      desc: 'Spent on Amazon buy Ps5',
      date: '06 Dec 2024',
      amount: 5
    },
    {
      type: 'OUTGO',
      desc: 'Spent on Amazon buy Ps5',
      date: '06 Dec 2024',
      amount: 5
    },
    {
      type: 'INCOME',
      desc: 'Transferred from wallet',
      date: '06 Dec 2024',
      amount: 142
    },
    {
      type: 'INCOME',
      desc: 'Completed Task successfully',
      date: '06 Dec 2024',
      amount: 142
    },
    {
      type: 'OUTGO',
      desc: 'Spent on Amazon buy Ps5',
      date: '06 Dec 2024',
      amount: 20
    }
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
          <h4 className="font-sans text-sm font-medium">
            Your balance is
          </h4>
          {/* numbers */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img src={IMAGES.kleoCoinPath} alt="" className="size-10" />
              <h1 className="font-bold font-sans text-5xl">{pointsToString(1452)}</h1>
            </div>
            <h3 className="font-medium font-sans text-lg text-center">XP Points</h3>
          </div>
          {/* 2 cards */}
          <div className="flex justify-center w-full max-w-md gap-4 flex-wrap">
            {WALLET_PAGE_DATA.transactionCards.map(transaction => (
              <StatCard
                title={transaction.title}
                value={transaction.value}
                type={transaction.type as 'INCOME' | 'OUTGO'}
                key={transaction.title}
              />
            ))}
          </div>
        </div>
        {/* Withdraw button */}
        <div className="w-full max-w-md px-4 py-3 bg-white hover:bg-white/80 cursor-pointer text-primary-700 text-center font-semibold text-lg rounded-xl">
          Withdraw Balance
        </div>
      </div>
      {/* Title + Description */}
      <div className="w-full flex flex-col gap-1 font-sans">
        <h1 className="font-bold text-2xl">{WALLET_PAGE_DATA.title}</h1>
        <p className="text-xs text-gray-700">{WALLET_PAGE_DATA.desc}</p>
      </div>
      {/* Previous Transactions */}
      <div className="flex flex-col gap-4 w-full overflow-auto">
        {WALLET_PAGE_DATA.transactions.map(transaction => (
          <TransactionCard
            amount={transaction.amount}
            date={transaction.date}
            desc={transaction.desc}
            type={transaction.type as ('OUTGO' | 'INCOME')}
          />
        ))}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string,
  value: number,
  type: "OUTGO" | "INCOME",
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
          <span className="font-bold text-xl">
            {pointsToString(value)}
          </span> XP
        </p>
      </div>
    </div>
  )
}

interface TransactionCardProps {
  type: 'INCOME' | 'OUTGO',
  desc: string,
  date: string,
  amount: number
}

export const TransactionCard = ({ amount, date, desc, type }: TransactionCardProps) => {
  return (
    <div className="bg-white rounded-lg w-full flex justify-between gap-4 px-4 py-2">
      <div className="flex flex-col flex-1">
        <h3 className="font-medium text-lg">{desc}</h3>
        <p className="font-normal text-[10px]">{date}</p>
      </div>
      <div className={`font-bold text-sm ${type === 'INCOME' ? 'text-[#12B76A]' : 'text-[#F97066]'}`}>
        <span className="font-semibold text-xl">{type === 'INCOME' ? '+' : '-'} {amount}</span> XP
      </div>
    </div>
  )
}
