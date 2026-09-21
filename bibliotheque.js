async function chargerDocumentsSupabase(type) {
    const resultat = await client.from('documents').select('*').eq('type', type).order('created_at', { ascending: false });
    if (resultat.error) {
        console.error(`Chargement des ${type} impossible`, resultat.error);
        return [];
    }
    return (resultat.data || []).filter(document => PROGRAMME_GESTION.estAssociationValide(document.classe, document.matiere));
}
