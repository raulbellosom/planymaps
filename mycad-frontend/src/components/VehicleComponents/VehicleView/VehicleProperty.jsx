import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const VehicleProperty = ({ label, value, icon: Icon }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold h-7">{label}</h2>
      <p className="flex items-center gap-2 justify-start h-6">
        <Icon size={20} className="mr-2 inline text-orange-500" />
        {value}
      </p>
    </div>
  );
};

VehicleProperty.Skeleton = function VehiclePropertySkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-6 rounded-md w-1/3" />
      <Skeleton className="h-5 rounded-md w-full" />
    </div>
  );
};
export default VehicleProperty;