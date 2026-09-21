(function () {
    const classes = ['2nde G1', '1ère G1', 'Terminale G1', '2nde G2', '1ère G2', 'Terminale G2', '2nde G3', '1ère G3', 'Terminale G3'];
    const matieresParClasse = {
        '2nde G1': ['Bureau Commercial', 'Économie Générale'],
        '1ère G1': ['Économie Générale'],
        'Terminale G1': ['Économie Générale'],
        '2nde G2': ['Bureau Commercial', 'Économie Générale'],
        '1ère G2': ['Économie Générale'],
        'Terminale G2': ['Économie Générale'],
        '2nde G3': ['Bureau Commercial', 'Technique Commerciale', 'Économie Générale'],
        '1ère G3': ['Technique Commerciale', 'Économie Générale'],
        'Terminale G3': ['Technique Commerciale', 'Économie Générale']
    };
    const matieres = ['Bureau Commercial', 'Technique Commerciale', 'Économie Générale'];
    const classesMatieres = classes.flatMap(classe => matieresParClasse[classe].map(matiere => [classe, matiere]));

    window.PROGRAMME_GESTION = {
        classes,
        matieres,
        matieresParClasse,
        classesMatieres,
        estAssociationValide: (classe, matiere) => Boolean(matieresParClasse[classe]?.includes(matiere)),
        synchroniserFiltres: (selecteurClasse, selecteurMatiere, afficher) => {
            function actualiser(source) {
                const classe = selecteurClasse.value;
                const matiere = selecteurMatiere.value;
                const classesDisponibles = classe === 'toutes' && matiere !== 'toutes'
                    ? classes.filter(classeDisponible => matieresParClasse[classeDisponible].includes(matiere))
                    : classes;
                const matieresDisponibles = classe !== 'toutes'
                    ? matieresParClasse[classe]
                    : matieres;
                if (source !== 'classe') {
                    selecteurClasse.innerHTML = `<option value="toutes">Toutes les classes</option>${classesDisponibles.map(option => `<option>${option}</option>`).join('')}`;
                    selecteurClasse.value = classesDisponibles.includes(classe) ? classe : 'toutes';
                }
                if (source !== 'matiere') {
                    selecteurMatiere.innerHTML = `<option value="toutes">Toutes les matières</option>${matieresDisponibles.map(option => `<option>${option}</option>`).join('')}`;
                    selecteurMatiere.value = matieresDisponibles.includes(matiere) ? matiere : 'toutes';
                }
                afficher();
            }
            selecteurClasse.addEventListener('change', () => actualiser('classe'));
            selecteurMatiere.addEventListener('change', () => actualiser('matiere'));
        }
    };
}());
