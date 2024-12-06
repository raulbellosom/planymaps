import ActionButtons from '../ActionButtons/ActionButtons';

const TableHeader = ({ title, icon: Icon, actions }) => {
  return (
    <div className="flex flex-row sm:items-center sm:justify-between text-start bg-white gap-4">
      <div className="flex items-center gap-2 text-planymaps-primary w-full">
        {Icon && <Icon className="inline-block text-2xl" />}
        <h1 className="text-xl xl:text-2xl font-bold">{title}</h1>
      </div>
      <div className="w-full flex gap-2 justify-start md:justify-end">
        <ActionButtons extraActions={actions} />
      </div>
    </div>
  );
};

export default TableHeader;
