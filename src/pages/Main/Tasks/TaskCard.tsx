interface TaskCardProps {
  description: string,
  title: string,
  iconSrc: string,
  script: string,
  stats: { label: string, value: string, iconSrc: string }[],
  rating: number,
  creator: string
}

export const TaskCard = ({ description, title, iconSrc, script, stats, rating, creator }: TaskCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md w-full p-4 mb-4 flex flex-col gap-3">
      {/* Favicon + Title + Creator + Rating Row */}
      <div className="flex gap-4">
        <div className="min-h-12 min-w-12 bg-grayblue-100 rounded-md p-2 flex items-center justify-center">
          <img src={iconSrc} className='size-10' />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex py-1 gap-2 justify-between">
            {/* Title */}
            <h2 className='font-semibold text-lg'>
              {title}
            </h2>
            {/* Rating */}
            <div className="h-fit flex items-center gap-1 px-2 py-1 rounded-full bg-grayblue-100 min-w-fit">
              <img src="../../assets/images/tasks/starIcon.svg" alt="" className="size-4" />
              <p className="text-xs">{rating} Rating</p>
            </div>
          </div>
          <p className="text-xs">Created by {creator}</p>
        </div>
      </div>
      {/* Description Row */}
      <div className="w-full text-xs">{description}</div>
      {/* stats pills */}
      <div className="flex gap-2 flex-wrap mb-1">
        {
          stats.map(stat => {
            return <StatPill
              label={`${stat.label}: `}
              value={stat.value}
              iconSrc={stat.iconSrc}
            />
          })
        }
      </div>
    </div>
  )
}

interface StatPillProps {
  label: string,
  value: string,
  iconSrc?: string,
}

const StatPill = ({ label, value, iconSrc }: StatPillProps) => {
  return (
    <div className="bg-grayblue-100 rounded-full p-2 gap-2 flex">
      <img src={iconSrc} alt="" className="size-4 rounded-full" />
      <p className="text-[10px]">
        <span className="font-bold">{label}</span> {value}
      </p>
    </div>
  )
}
