function Footer() {
    return (
        <footer style={styles.footer}>
            <p>© 2024 Banking System. All rights reserved.</p>
        </footer>
    );
}

const styles = {
    footer: {
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#2c3e50',
        color: 'white',
        marginTop: '40px'
    }
};

export default Footer;
