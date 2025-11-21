import { useState } from 'react';
import * as ParameterHandlers from '../handlers/parameterHandlers';

export const useParameterEditing = (api, loadData, setParameters, setters) => {
  const [unsavedParameterChanges, setUnsavedParameterChanges] = useState({});
  const [isSavingParameters, setIsSavingParameters] = useState(false);
  const { setSeuilSurstockProfond, setDeviseDefaut, setMultiplicateurDefaut } = setters;

  const handleParameterChange = (paramName, value) => {
    return ParameterHandlers.handleParameterChange(paramName, value, setUnsavedParameterChanges);
  };

  const saveAllParameters = async () => {
    return await ParameterHandlers.saveAllParameters(
      unsavedParameterChanges,
      api,
      loadData,
      setUnsavedParameterChanges,
      setIsSavingParameters
    );
  };

  const onUpdateSeuilSurstock = (newValue) => ParameterHandlers.handleUpdateSeuilSurstock(
    newValue,
    api,
    setSeuilSurstockProfond,
    (key, value) => ParameterHandlers.updateParameterState(key, value, setParameters)
  );

  const onUpdateDevise = (newDevise) => ParameterHandlers.handleUpdateDevise(
    newDevise,
    api,
    setDeviseDefaut,
    (key, value) => ParameterHandlers.updateParameterState(key, value, setParameters)
  );

  const onUpdateMultiplicateur = (newValue) => ParameterHandlers.handleUpdateMultiplicateur(
    newValue,
    api,
    setMultiplicateurDefaut,
    (key, value) => ParameterHandlers.updateParameterState(key, value, setParameters)
  );

  return {
    unsavedParameterChanges,
    isSavingParameters,
    handleParameterChange,
    saveAllParameters,
    onUpdateSeuilSurstock,
    onUpdateDevise,
    onUpdateMultiplicateur
  };
};

