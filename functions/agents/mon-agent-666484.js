/**
 * Agent to fetch the latest blog articles data.
 * Due to system constraints (no file system access), this agent returns the structured data
 * that *could be used* to generate an Excel file, rather than generating the file itself.
 * Another process or a client-side application would be responsible for taking this data
 * and converting it into an Excel file for download.
 *
 * Schedule: 0 0 * * * (daily at midnight)
 */

export default async function agent(context) {
  const { env } = context;

  // Expected environment variables:
  // - BLOG_API_URL: The URL of the blog API endpoint to fetch articles.
  // - BLOG_API_KEY: (Optional) API key for authentication.
  // - BLOG_POST_COUNT: (Optional) Number of latest articles to fetch (default to 10).

  const BLOG_API_URL = env.BLOG_API_URL;
  const BLOG_API_KEY = env.BLOG_API_KEY;
  const BLOG_POST_COUNT = parseInt(env.BLOG_POST_COUNT || '10', 10);

  if (!BLOG_API_URL) {
    return {
      success: false,
      message: "Missing BLOG_API_URL environment variable.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (BLOG_API_KEY) {
      headers['Authorization'] = `Bearer ${BLOG_API_KEY}`;
    }

    // Construct the API URL with query parameters for latest articles and count
    const apiUrl = `${BLOG_API_URL}/posts?_sort=createdAt&_order=desc&_limit=${BLOG_POST_COUNT}`;

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch blog articles: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const articles = await response.json();

    // Process articles to extract relevant fields for the "listing"
    const processedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      author: article.author || 'N/A',
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : 'N/A',
      summary: article.summary ? article.summary.substring(0, 100) + '...' : 'No summary', // Truncate summary
      url: article.url || `${BLOG_API_URL}/posts/${article.slug}`, // Example URL
    }));

    return {
      success: true,
      message: `Successfully fetched ${processedArticles.length} latest blog articles. Data is ready for Excel generation.`,
      timestamp: new Date().toISOString(),
      data: processedArticles, // Return the structured data
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching blog articles: ${error.message}`,
      timestamp: new Date().toISOString(),
      data: null,
    };
  }
}