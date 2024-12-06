import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import classNames from 'classnames';
import Notifies from '../../Notifies/Notifies';
import { FaSearch } from 'react-icons/fa';

const InventoryProperty = ({ label, value, icon: Icon, onSearch }) => {
  const formattedValue =
    value && typeof value === 'string'
      ? value.replace(/\n/g, '<br />')
      : String(value);

  const handleDoubleClick = () => {
    Notifies('success', `Campo ${label} copiado al portapapeles`);
    navigator.clipboard.writeText(value);
  };

  if (label === 'Estado') {
    value = value === 'PROPUESTA' ? 'PROPUESTA DE BAJA' : value;
    return (
      <div
        onDoubleClick={() => handleDoubleClick()}
        className="group flex flex-col h-full text-nowrap"
      >
        <h2 className="text-sm 2xl:text-base font-semibold h-7">{label}</h2>
        <p
          className={classNames(
            'relative text-xs md:text-sm 2xl:text-base p-1.5 rounded-md text-white flex items-center gap-2 justify-start min-h-6 w-full',
            {
              'bg-planymaps-primary': value === 'ALTA',
              'bg-planymaps-danger': value === 'BAJA',
              'bg-planymaps-warning': value === 'PROPUESTA DE BAJA',
            },
          )}
        >
          {Icon && (
            <i>
              <Icon size={22} className="inline" />
            </i>
          )}
          <span dangerouslySetInnerHTML={{ __html: formattedValue }} />
          {onSearch && (
            <i
              onClick={onSearch}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 hidden group-hover:inline-block text-right p-2 text-neutral-800 bg-neutral-200 rounded-md cursor-pointer"
            >
              <FaSearch />
            </i>
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => handleDoubleClick()}
      className="group flex flex-col h-full text-nowrap"
    >
      <h2 className="text-sm 2xl:text-base font-semibold h-7">{label}</h2>
      <p className="relative text-xs md:text-sm 2xl:text-base p-1.5 flex items-center gap-2 justify-start min-h-6 border-b border-neutral-100 pb-1">
        {Icon && (
          <i>
            <Icon size={22} className="inline text-purple-500" />
          </i>
        )}
        <span dangerouslySetInnerHTML={{ __html: formattedValue }} />
        {onSearch && (
          <i
            onClick={onSearch}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 hidden group-hover:inline-block text-right p-2 text-neutral-800 bg-neutral-200 rounded-md cursor-pointer"
          >
            <FaSearch />
          </i>
        )}
      </p>
    </div>
  );
};

InventoryProperty.Skeleton = function InventoryPropertySkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-6 rounded-md w-1/3" />
      <Skeleton className="h-5 rounded-md w-full" />
    </div>
  );
};
export default InventoryProperty;
