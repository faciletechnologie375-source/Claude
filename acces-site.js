(function () {
    const client = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    document.documentElement.classList.add('verification-acces');
    client.auth.getSession().then(({ data }) => {
        if (!data.session) {
            const retour = encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
            window.location.replace(`connexion.html?retour=${retour}`);
            return;
        }
        document.documentElement.classList.remove('verification-acces');
    });
}());
