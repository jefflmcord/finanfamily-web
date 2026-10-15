// Cadastrar Objetivo/Meta através da rota dedicada /api/goals
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetAmount || !goalMonths) return;

    let resolvedFamilyId = 1;
    const userStr = localStorage.getItem('@FinanFamily:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        resolvedFamilyId = Number(userObj.family_id || userObj.familyId || familyId || 1);
      } catch (e) {
        resolvedFamilyId = Number(familyId || 1);
      }
    } else {
      resolvedFamilyId = Number(familyId || 1);
    }

    setSavingGoal(true);
    setError('');

    try {
      const payload = {
        family_id: resolvedFamilyId,
        title: goalTitle.trim(),
        target_amount: Number(goalTargetAmount.toString().replace(',', '.')),
        months: Number(goalMonths) || 1
      };

      const res = await fetch('https://finanfamily-api.onrender.com/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsGoalModalOpen(false);
        setGoalTitle('');
        setGoalTargetAmount('');
        setGoalMonths('12');
        await fetchData();
      } else {
        setError(data.error || 'Erro ao criar objetivo.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar objetivo.');
    } finally {
      setSavingGoal(false);
    }
  };