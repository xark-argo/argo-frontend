import {useState} from 'react'

import {inChina} from '~/lib/utils'
import {isInArgo} from '~/utils'

import WechatCode from '../WechatCode'
import InviteIcon from './icon'

function InviteItem() {
  const [showQrcode, setShowQrcode] = useState(false)

  const wechatJoin = () => {
    return (
      <div
        // id="wechatJoin"
        className={`group relative flex h-12 items-center justify-around ${showQrcode && 'bg-[#ebebeb]'} hover:cursor-pointer hover:bg-[#ebebeb]`}
        onClick={() => setShowQrcode((item) => !item)}
      >
        <div className="pointer-events-none">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`fill-[#03060e] group-hover:fill-[#133ebf] ${showQrcode && 'fill-[#133ebf]'}`}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.9761 13.6625C17.5226 13.6625 17.1598 13.2997 17.1598 12.8462C17.1598 12.3927 17.5226 12.0299 17.9761 12.0299C18.4296 12.0299 18.7924 12.3927 18.7924 12.8462C18.7924 13.2771 18.4296 13.6625 17.9761 13.6625ZM13.9591 13.6625C13.5056 13.6625 13.1428 13.2997 13.1428 12.8462C13.1428 12.3927 13.5056 12.0299 13.9591 12.0299C14.4126 12.0299 14.7754 12.3927 14.7754 12.8462C14.7754 13.2771 14.4126 13.6625 13.9591 13.6625ZM19.9242 18.2435C21.1968 17.3275 22.0005 15.9647 22.0005 14.4678C22.0005 11.6975 19.3214 9.46344 15.9949 9.46344C12.6683 9.46344 9.98926 11.6975 9.98926 14.4678C9.98926 17.2381 12.6683 19.4722 15.9949 19.4722C16.687 19.4722 17.3344 19.3829 17.9595 19.2041C18.0042 19.1818 18.0712 19.1818 18.1382 19.1818C18.2498 19.1818 18.3614 19.2265 18.4507 19.2711L19.7679 20.0307C19.8126 20.0531 19.8349 20.0754 19.8796 20.0754C19.9912 20.0754 20.0805 19.9861 20.0805 19.8744C20.0805 19.8297 20.0582 19.785 20.0582 19.718C20.0582 19.6956 19.8796 19.0924 19.7903 18.7126C19.7679 18.6679 19.7679 18.6233 19.7679 18.5786C19.7456 18.4222 19.8126 18.3105 19.9242 18.2435Z"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.5631 8.93874C11.0424 8.93874 10.6301 8.52652 10.6301 8.00582C10.6301 7.48512 11.0424 7.0729 11.5631 7.0729C12.0838 7.0729 12.496 7.48512 12.496 8.00582C12.496 8.50483 12.0838 8.93874 11.5631 8.93874ZM6.78544 8.93874C6.26474 8.93874 5.85252 8.52652 5.85252 8.00582C5.85252 7.48512 6.26474 7.0729 6.78544 7.0729C7.30613 7.0729 7.71835 7.48512 7.71835 8.00582C7.71835 8.50483 7.30613 8.93874 6.78544 8.93874ZM9.22771 3.92365C5.24464 3.92365 2 6.59966 2 9.92237C2 11.7287 2.9622 13.3566 4.5062 14.4493C4.61809 14.5385 4.70759 14.6723 4.70759 14.8507C4.70759 14.8953 4.68522 14.9622 4.68522 15.0068C4.57333 15.4528 4.37194 16.1887 4.34957 16.211C4.32719 16.2779 4.30481 16.3225 4.30481 16.3894C4.30481 16.5232 4.4167 16.6347 4.55096 16.6347C4.59571 16.6347 4.64046 16.6124 4.68522 16.5901L6.27397 15.6758C6.38586 15.6089 6.52012 15.5643 6.65438 15.5643C6.72151 15.5643 6.78864 15.5643 6.85577 15.5866C7.5942 15.7873 8.39977 15.9211 9.20533 15.9211C9.33959 15.9211 9.47385 15.9211 9.60812 15.9211C9.45148 15.4528 9.36197 14.9622 9.36197 14.4493C9.36197 11.4388 12.3157 8.98577 15.9408 8.98577C16.075 8.98577 16.2093 8.98577 16.3435 8.98577C15.8289 6.10905 12.8304 3.92365 9.22771 3.92365Z"
            />
          </svg>
        </div>
        <WechatCode showQrcode={showQrcode} setShowQrcode={setShowQrcode} />
      </div>
    )
  }

  const discordJoin = () => {
    return (
      <div className="h-[140px] p-[10px]">
        <div className="flex flex-col gap-6 justify-center items-around">
          <a
            href="https://x.com/zmltqz"
            target="_blank"
            rel="noreferrer"
            aria-label="link"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-[#565759] hover:fill-[#133ebf]  hover:cursor-pointer"
            >
              <path d="M16.9354 4.3172H19.5421L13.8471 10.8263L20.5469 19.6836H15.301L11.1923 14.3117L6.49093 19.6836H3.88257L9.97398 12.7215L3.54688 4.3172H8.92591L12.6399 9.22737L16.9354 4.3172ZM16.0205 18.1233H17.4649L8.14104 5.79553H6.591L16.0205 18.1233Z" />
            </svg>
          </a>

          <a
            href="https://discord.gg/TuMNxXxyEy"
            target="_blank"
            rel="noreferrer"
            aria-label="link"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="fill-[#565759] hover:fill-[#133ebf] hover:cursor-pointer"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.9556 5.69231C17.6518 5.096 16.2671 4.66139 14.8218 4.41882C14.6399 4.73215 14.4377 5.15664 14.2962 5.49018C12.759 5.26781 11.2328 5.26781 9.71672 5.49018C9.57521 5.15664 9.36295 4.73215 9.19112 4.41882C7.73573 4.66139 6.35105 5.096 5.05634 5.69231C2.4386 9.55322 1.73111 13.3231 2.08485 17.0425C3.82327 18.3059 5.50106 19.0741 7.14953 19.5795C7.55382 19.0337 7.91768 18.4474 8.231 17.8309C7.63468 17.6086 7.06868 17.3357 6.5229 17.0122C6.6644 16.9112 6.8059 16.8 6.93729 16.6888C10.2322 18.1948 13.801 18.1948 17.0555 16.6888C17.197 16.8 17.3284 16.9112 17.4699 17.0122C16.9241 17.3357 16.3581 17.6086 15.7618 17.8309C16.0751 18.4474 16.439 19.0337 16.8432 19.5795C18.4907 19.0741 20.1786 18.3059 21.9079 17.0425C22.3425 12.737 21.2196 8.99736 18.9556 5.69231ZM8.68581 14.7483C7.6953 14.7483 6.88674 13.8487 6.88674 12.7471C6.88674 11.6454 7.67509 10.7458 8.68581 10.7458C9.68639 10.7458 10.505 11.6454 10.4848 12.7471C10.4848 13.8487 9.68639 14.7483 8.68581 14.7483ZM15.3272 14.7483C14.3367 14.7483 13.5271 13.8487 13.5271 12.7471C13.5271 11.6454 14.3164 10.7458 15.3272 10.7458C16.3278 10.7458 17.1464 11.6454 17.1262 12.7471C17.1262 13.8487 16.3379 14.7483 15.3272 14.7483Z" />
            </svg>
          </a>

          <a
            href="https://github.com/xark-argo/argo"
            target="_blank"
            rel="noreferrer"
            aria-label="link"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="fill-[#565759] hover:fill-[#133ebf] hover:cursor-pointer"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 1.97534C17.525 1.97534 22 6.45034 22 11.9753C21.9995 14.0706 21.3419 16.1129 20.1198 17.8149C18.8977 19.5168 17.1727 20.7927 15.1875 21.4628C14.6875 21.5628 14.5 21.2503 14.5 20.9878C14.5 20.6503 14.5125 19.5753 14.5125 18.2378C14.5125 17.3003 14.2 16.7003 13.8375 16.3878C16.0625 16.1378 18.4 15.2878 18.4 11.4503C18.4 10.3503 18.0125 9.46284 17.375 8.76284C17.475 8.51284 17.825 7.48784 17.275 6.11284C17.275 6.11284 16.4375 5.83784 14.525 7.13784C13.725 6.91284 12.875 6.80034 12.025 6.80034C11.175 6.80034 10.325 6.91284 9.525 7.13784C7.6125 5.85034 6.775 6.11284 6.775 6.11284C6.225 7.48784 6.575 8.51284 6.675 8.76284C6.0375 9.46284 5.65 10.3628 5.65 11.4503C5.65 15.2753 7.975 16.1378 10.2 16.3878C9.9125 16.6378 9.65 17.0753 9.5625 17.7253C8.9875 17.9878 7.55 18.4128 6.65 16.9003C6.4625 16.6003 5.9 15.8628 5.1125 15.8753C4.275 15.8878 4.775 16.3503 5.125 16.5378C5.55 16.7753 6.0375 17.6628 6.15 17.9503C6.35 18.5128 7 19.5878 9.5125 19.1253C9.5125 19.9628 9.525 20.7503 9.525 20.9878C9.525 21.2503 9.3375 21.5503 8.8375 21.4628C6.8458 20.7999 5.11342 19.5266 3.88611 17.8236C2.65881 16.1207 1.9989 14.0745 2 11.9753C2 6.45034 6.475 1.97534 12 1.97534Z" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center mb-[10px]">
      <div
        onClick={() => {
          if (isInArgo()) {
            window.argoBridge.openBrowser('https://www.xark-argo.com/bots')
          } else {
            window.open('https://www.xark-argo.com/bots')
          }
        }}
        className=" cursor-pointer items-center text-[#565759] text-[14px] border-b-[0.5px] border-[#EBEBEB]"
      >
        <InviteIcon className="w-[30px] h-[30px] stroke-[#565759] hover:stroke-[#133ebf] hover:cursor-pointer" />
      </div>
      <div className="w-[30px] h-[0.5px] mx-auto my-[14px] bg-[#AEAFB3]" />
      {!inChina() && discordJoin()}
      {inChina() && wechatJoin()}
    </div>
  )
}

export default InviteItem
