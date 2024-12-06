import React from 'react';
import { FaRegCalendar } from 'react-icons/fa';
import ActionButtons from '../ActionButtons/ActionButtons';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { Dropdown } from 'flowbite-react';
import classNames from 'classnames';
import { MdEditCalendar } from 'react-icons/md';
import Logo from '../../assets/logos/logo.png';

const MapsCard = ({ map, actions, collapsedActions, role }) => {
  return (
    <article
      className={classNames(
        'flex rounded-lg rounded-l-xl shadow-sm h-full max-h-[38dvh] 2xl:max-h-[38dvh] hover:shadow-lg transition ease-in-out duration-200',
        map.visibility === 'private' && 'bg-planymaps-secondary-light',
        map.visibility === 'public' && 'bg-planymaps-primary',
      )}
    >
      <div className="w-[98%] flex border border-neutral-300 bg-neutral-50 flex-col rounded-md justify-between">
        <div className="flex flex-row gap-2 h-full w-full relative">
          <div className="hidden w-1/4 min-w-[20%] p-2 h-full md:flex items-center justify-center">
            <img
              src={Logo}
              alt="logo"
              className="h-auto w-full object-contain rounded-t-lg"
            />
          </div>
          <div className="flex rounded-md flex-col gap-3 p-2 pt-4 pb-2  w-full h-full">
            <div className="absolute top-4 right-3">
              <span
                className={`px-3 py-1 text-xs md:text-base font-semibold rounded-full text-white ${
                  map.visibility === 'private'
                    ? 'bg-planymaps-secondary-light'
                    : 'bg-planymaps-primary'
                }`}
              >
                {map?.visibility === 'private' ? 'Privado' : 'Público'}
              </span>
            </div>
            <div className="mb-1 pb-1 border-b border-neutral-100">
              <h4 className="text-lg md:text-xl font-semibold text-neutral-800 w-9/12">
                {map?.name}
              </h4>
              <h6 className="text-sm md:text-base font-normal text-neutral-500/70">
                {map?.description}
              </h6>
            </div>
            <div className="w-full flex gap-3 items-start">
              <span>
                <FaRegCalendar size={20} className=" text-neutral-400" />
              </span>
              <p className="text-sm md:text-base text-neutral-800">
                {map?.createdAt}
              </p>
            </div>
            <div className="w-full flex gap-3 items-start">
              <span>
                <MdEditCalendar size={20} className=" text-neutral-400" />
              </span>
              <p className="text-sm md:text-base text-neutral-800">
                {map?.updatedAt}
              </p>
            </div>
          </div>
        </div>
        <div className="w-full rounded-b-lg bg-white flex gap-2 p-4 text-neutral-200">
          <>
            {actions && <ActionButtons extraActions={actions} />}
            {collapsedActions && role !== 'Athlete' && (
              <Dropdown
                renderTrigger={() => (
                  <button className="w-fit bg-white hover:bg-neutral-200 md:w-fit h-9 xl:h-10 text-sm xl:text-base cursor-pointer transition ease-in-out duration-200 p-4 flex items-center justify-center rounded-md border border-neutral-200 text-stone-800">
                    <BsThreeDotsVertical className="text-lg text-neutral-600" />
                  </button>
                )}
                dismissOnClick={false}
                inline
                arrowIcon={null}
                placement="right"
                className="md:w-52"
              >
                {collapsedActions?.map((action, index) => (
                  <Dropdown.Item
                    key={index}
                    className="min-w-36 min-h-12 hover:bg-neutral-100 text-neutral-600"
                    onClick={() => action?.action(map?.id)}
                    icon={action?.icon}
                  >
                    <span>{action?.label}</span>
                  </Dropdown.Item>
                ))}
              </Dropdown>
            )}
          </>
        </div>
      </div>
    </article>
  );
};

export default MapsCard;
