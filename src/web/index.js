// Index Page - Auto-redirect to Comparison Page
document.addEventListener('DOMContentLoaded', () => {
    // Show loading message for a brief moment
    setTimeout(() => {
        // Redirect to comparison page
        window.location.href = 'src/web/comparison.html';
    }, 1500); // 1.5 second delay to show the redirect message
});
