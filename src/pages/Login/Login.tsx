const IMAGES = {
  KleoLogoInCirclePath: '../../assets/images/login/kleoLogoInCircle.svg'
}

export const Login = () => {
  return (
    <div className="w-full h-full p-8 flex flex-col justify-center">
      <div className="flex flex-col gap-4 w-full items-center">
        <img src={IMAGES.KleoLogoInCirclePath} />
      </div>
    </div>
  )
}
