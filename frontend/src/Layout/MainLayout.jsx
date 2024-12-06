import { FiSidebar } from 'react-icons/fi';
import ActionButtons from '../components/ActionButtons/ActionButtons';

const MainLayout = ({
  children,
  setCollapsed = () => {},
  setToggled = () => {},
  broken,
}) => {
  return (
    <div className="flex flex-col flex-1 h-full bg-white overflow-y-auto overflow-x-hidden relative">
      <div className="flex items-center justify-start absolute top-2 left-2 md:left-0 z-50">
        <ActionButtons
          extraActions={[
            {
              color: 'white',
              icon: FiSidebar,
              action: broken ? () => setToggled() : () => setCollapsed(),
              filled: true,
            },
          ]}
        />
        <h1 className="text-2xl font-medium text-center w-full md:hidden">
          planymaps
        </h1>
      </div>
      <div className="flex-1 h-full max-h-[100dvh]">{children}</div>
    </div>
  );
};

export default MainLayout;
