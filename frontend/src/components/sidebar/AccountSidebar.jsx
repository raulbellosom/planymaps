import React from 'react';
import classNames from 'classnames';
import Icon from '../../assets/logos/logo.png';
import ImageViewer from '../ImageViewer/ImageViewer';
import Profile from '../../assets/images/profile.png';

const AccountSidebar = ({ name, role, photo, collapsed }) => {
  return (
    <div className="p-4 h-fit space-y-5">
      <div
        className={`w-full overflow-hidden whitespace-nowrap text-nowrap flex justify-start gap-4 items-center`}
      >
        <img src={Icon} alt="ICON" className="h-auto w-10" />
        <span
          className={`text-2xl text-planymaps-primary font-extrabold mb-2 truncate`}
        >
          planymaps
        </span>
      </div>
      <div
        className={classNames(
          'w-full whitespace-nowrap overflow-hidden flex justify-start gap-4 items-center',
        )}
      >
        <div className="flex justify-center items-center h-10 w-10 min-w-10 min-h-10 overflow-hidden rounded-full bg-white border border-neutral-200">
          <ImageViewer
            images={photo ? [photo] : [Profile]}
            imageStyles={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        <div className={'truncate whitespace-nowrap text-nowrap'}>
          <h2
            className={classNames(
              'text-sm font-bold text-secondary w-full truncate',
            )}
          >
            {name}
          </h2>
          <p
            className={classNames(
              'text-planymaps-secondary-light w-full truncate text-xs',
            )}
          >
            {role}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSidebar;
