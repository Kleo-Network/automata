interface DataCardBodyData {
  description: string
  data: string
  direction: string
}

export default function DataCardBody({
  description,
  data,
  direction
}: DataCardBodyData) {
  return (
    <div className="flex flex-col items-center justify-end gap-2 self-stretch mt-4 font-medium flex-1 mb-2">
      <div className="flex flex-row items-center justify-start w-full">
        <span className="text-6xl font-bold text-white">{data}</span>
        <img src="../assets/images/arrowDataCard.svg" className={`w-14 h-14 ml-4 ${
            direction == 'increased' ? '' : 'rotate-180'
          }`} />
      </div>
      <span className="text-sm text-white">{description}</span>
    </div>
  )
}
