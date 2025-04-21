import React, { useMemo, useState, useEffect } from 'react';
import { generateGridWithLabels } from '../../utils/CanvasUtils';
import ModalViewer from '../Modals/ModalViewer';
import { TbRestore } from 'react-icons/tb';
import { MdOutlineFormatColorFill } from 'react-icons/md';
import ActionButtons from '../ActionButtons/ActionButtons';
import { useMapsContext } from '../../context/MapsContext';

const GridFromCanvas = ({
  imageDimensions,
  showGrid,
  initialCellSize = 50,
  initialCellColor = '#6b7280',
  layerProps,
  modalGridConfig,
  setModalGridConfig,
}) => {
  const { useUpdateLayer } = useMapsContext();
  const [cellSize, setCellSize] = useState(initialCellSize);
  const [cellColor, setCellColor] = useState(initialCellColor);
  const [prevCellSize, setPrevCellSize] = useState(initialCellSize);
  const [prevCellColor, setPrevCellColor] = useState(initialCellColor);

  // Sincronizar el estado con las props cuando cambian
  useEffect(() => {
    setCellSize(initialCellSize);
    setCellColor(initialCellColor);
    setPrevCellSize(initialCellSize);
    setPrevCellColor(initialCellColor);
  }, [initialCellSize, initialCellColor]);

  const gridBackground = useMemo(() => {
    if (imageDimensions.width && imageDimensions.height) {
      return generateGridWithLabels(
        imageDimensions.width,
        imageDimensions.height,
        cellSize,
        cellColor,
      );
    }
    return null;
  }, [imageDimensions, cellSize, cellColor]);

  const handleSaveGridSettings = async () => {
    setCellSize(prevCellSize);
    setCellColor(prevCellColor);

    try {
      await useUpdateLayer({
        ...layerProps,
        cellSize: prevCellSize,
        cellColor: prevCellColor,
      });
    } catch (error) {
      console.error(error);
    }
    setModalGridConfig(false);
  };

  if (!showGrid || !gridBackground) return null;

  return (
    <>
      <img
        src={gridBackground}
        alt="Grid"
        className="absolute z-50 top-0 left-0"
      />

      {modalGridConfig && (
        <ModalViewer
          size="3xl"
          isOpenModal={modalGridConfig}
          setIsOpenModal={setModalGridConfig}
          dismissible={false}
          onCloseModal={() => setModalGridConfig(false)}
          title="Configuración de la cuadrícula"
        >
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <div>
                  <label htmlFor="cell-color">Color de la cuadrícula</label>
                  <p className="text-sm text-gray-500">
                    Haz clic en el color para seleccionar uno nuevo.
                  </p>
                </div>
                <input
                  name="cell-color"
                  id="cell-color"
                  type="color"
                  className="w-full h-24"
                  value={prevCellColor}
                  onChange={(e) => setPrevCellColor(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="cell-size">Tamaño de la celda (px)</label>
                <input
                  name="cell-size"
                  id="cell-size"
                  type="number"
                  className="w-full"
                  min="1"
                  step="1"
                  value={prevCellSize}
                  onChange={(e) => setPrevCellSize(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-end text-nowrap">
              <ActionButtons
                extraActions={[
                  {
                    icon: TbRestore,
                    label: 'Reestablecer cuadrícula',
                    action: () => {
                      setPrevCellColor('#6b7280');
                      setPrevCellSize(50);
                    },
                    color: 'info',
                  },
                  {
                    icon: MdOutlineFormatColorFill,
                    label: 'Guardar cuadrícula',
                    action: handleSaveGridSettings,
                    color: 'primary',
                    filled: true,
                  },
                ]}
              />
            </div>
          </div>
        </ModalViewer>
      )}
    </>
  );
};

export default GridFromCanvas;
