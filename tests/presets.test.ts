/**
 * Tests for preset regex patterns.
 *
 * Each preset has a titleRegex and/or urlRegex.
 * extractGroupNameFromTitle/Url always return match[1] (first capture group).
 * Tests use realistic browser tab titles and URLs for each service.
 */
import { describe, it, expect, vi } from 'vitest';
import { extractGroupNameFromTitle, extractGroupNameFromUrl } from '../src/utils/utils.js';

vi.mock('../src/utils/logger.js', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() }
}));

const matchTitle = (regex: string, title: string) => extractGroupNameFromTitle(title, regex);
const matchUrl = (regex: string, url: string) => extractGroupNameFromUrl(url, regex);

describe('Preset Regex Patterns', () => {

  // ─────────────────────────────────────────────────────────
  // GENERIC PATTERNS
  // ─────────────────────────────────────────────────────────

  describe('numeric-id', () => {
    const titleRegex = 'ID[:\\s]*(\\d+)';
    const urlRegex = 'id[=/](\\d+)';

    it('title: extracts numeric ID', () => {
      expect(matchTitle(titleRegex, 'Ticket ID 12345')).toBe('12345');
      expect(matchTitle(titleRegex, 'Invoice ID: 99')).toBe('99');
    });

    it('url: extracts numeric ID', () => {
      expect(matchUrl(urlRegex, 'https://example.com/resource?id=12345')).toBe('12345');
      expect(matchUrl(urlRegex, 'https://example.com/resource/id=99')).toBe('99');
    });
  });

  describe('alphanumeric-id', () => {
    const titleRegex = '\\[([A-Z0-9-]+)\\]';

    it('title: extracts alphanumeric code from brackets', () => {
      expect(matchTitle(titleRegex, '[PROJ-123] Fix the bug')).toBe('PROJ-123');
      expect(matchTitle(titleRegex, '[ABC-999] Some task')).toBe('ABC-999');
    });
  });

  describe('content-in-parentheses', () => {
    const titleRegex = '\\(([^)]+)\\)';

    it('title: extracts content inside parentheses', () => {
      expect(matchTitle(titleRegex, 'Article (Catégorie)')).toBe('Catégorie');
      expect(matchTitle(titleRegex, 'Dashboard (Admin Panel)')).toBe('Admin Panel');
    });
  });

  describe('content-in-brackets', () => {
    const titleRegex = '\\[([^\\]]+)\\]';

    it('title: extracts content inside brackets', () => {
      expect(matchTitle(titleRegex, 'Document [Version 2.0]')).toBe('Version 2.0');
      expect(matchTitle(titleRegex, 'API Reference [v3.1]')).toBe('v3.1');
    });
  });

  describe('date-pattern', () => {
    const urlRegex = '(\\d{4}-\\d{2}-\\d{2})';

    it('url: extracts ISO date', () => {
      expect(matchUrl(urlRegex, 'https://example.com/reports/2024-03-15')).toBe('2024-03-15');
      expect(matchUrl(urlRegex, 'https://blog.example.com/2024-01-31/post')).toBe('2024-01-31');
    });
  });

  describe('version-number', () => {
    const titleRegex = '[vV](\\d+(?:\\.\\d+)*)';
    const urlRegex = '[vV](\\d+(?:\\.\\d+)*)';

    it('title: extracts version number', () => {
      expect(matchTitle(titleRegex, 'API v2.1.3 Reference')).toBe('2.1.3');
      expect(matchTitle(titleRegex, 'Release V3.0')).toBe('3.0');
    });

    it('url: extracts version from URL', () => {
      expect(matchUrl(urlRegex, 'https://docs.example.com/v2.1/api')).toBe('2.1');
    });
  });

  describe('uuid-pattern', () => {
    const urlRegex = '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})';

    it('url: extracts UUID', () => {
      expect(matchUrl(urlRegex, 'https://example.com/object/550e8400-e29b-41d4-a716-446655440000'))
        .toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('user-mention', () => {
    const urlRegex = '/@([a-zA-Z0-9_]+)';

    it('url: extracts username after @', () => {
      expect(matchUrl(urlRegex, 'https://example.com/@username/posts')).toBe('username');
      expect(matchUrl(urlRegex, 'https://social.example.com/@john_doe')).toBe('john_doe');
    });
  });

  // ─────────────────────────────────────────────────────────
  // DEVELOPMENT & CODE
  // ─────────────────────────────────────────────────────────

  describe('github-repo', () => {
    const urlRegex = 'github\\.com/([^/]+/[^/]+)';

    it('url: extracts owner/repo', () => {
      expect(matchUrl(urlRegex, 'https://github.com/microsoft/vscode')).toBe('microsoft/vscode');
      expect(matchUrl(urlRegex, 'https://github.com/facebook/react/tree/main')).toBe('facebook/react');
    });
  });

  describe('github-issue', () => {
    // FIXED: was (.+?)\\s*·\\s*Issue\\s*#(\\d+) → match[1] was issue title, not number
    const titleRegex = '·\\s*Issue\\s*#(\\d+)';
    const urlRegex = 'issues/(\\d+)';

    it('title: extracts issue number', () => {
      expect(matchTitle(titleRegex, 'Fix memory leak · Issue #1234 · microsoft/vscode')).toBe('1234');
      expect(matchTitle(titleRegex, 'Crash on startup · Issue #567 · owner/repo')).toBe('567');
    });

    it('url: extracts issue number', () => {
      expect(matchUrl(urlRegex, 'https://github.com/microsoft/vscode/issues/1234')).toBe('1234');
      expect(matchUrl(urlRegex, 'https://github.com/facebook/react/issues/42')).toBe('42');
    });

    it('old broken titleRegex returned issue title instead of number', () => {
      const brokenRegex = '(.+?)\\s*·\\s*Issue\\s*#(\\d+)';
      // match[1] is the issue description text, not the number
      expect(matchTitle(brokenRegex, 'Fix memory leak · Issue #1234 · microsoft/vscode'))
        .toBe('Fix memory leak');
    });
  });

  describe('stackoverflow-question', () => {
    const urlRegex = 'questions/(\\d+)';

    it('url: extracts question ID', () => {
      expect(matchUrl(urlRegex, 'https://stackoverflow.com/questions/12345678/how-to-fix-this')).toBe('12345678');
      expect(matchUrl(urlRegex, 'https://serverfault.com/questions/99999/server-issue')).toBe('99999');
    });
  });

  describe('gitlab-project', () => {
    const urlRegex = 'gitlab\\.com/([^/]+/[^/]+)';

    it('url: extracts group/project', () => {
      expect(matchUrl(urlRegex, 'https://gitlab.com/gitlab-org/gitlab')).toBe('gitlab-org/gitlab');
      expect(matchUrl(urlRegex, 'https://gitlab.com/myteam/my-project/-/issues')).toBe('myteam/my-project');
    });
  });

  describe('figma-file', () => {
    const titleRegex = '(.+?)\\s*–\\s*Figma';
    // FIXED: was figma\\.com/file/[^/]+/(.+) → didn't support /design/ and captured query params
    const urlRegex = 'figma\\.com/(?:file|design)/[^/]+/([^?/]+)';

    it('title: extracts file name (em dash)', () => {
      expect(matchTitle(titleRegex, 'Design System – Figma')).toBe('Design System');
      expect(matchTitle(titleRegex, 'Mobile App Mockups – Figma')).toBe('Mobile App Mockups');
    });

    it('url: extracts file name from legacy /file/ URL', () => {
      expect(matchUrl(urlRegex, 'https://www.figma.com/file/abc123XYZ/Design-System?node-id=0:1'))
        .toBe('Design-System');
    });

    it('url: extracts file name from new /design/ URL', () => {
      expect(matchUrl(urlRegex, 'https://www.figma.com/design/abc123XYZ/Mobile-App-Mockups?node-id=0:1'))
        .toBe('Mobile-App-Mockups');
    });

    it('old broken urlRegex included query params', () => {
      const brokenRegex = 'figma\\.com/file/[^/]+/(.+)';
      // Captures query params as part of the name
      expect(matchUrl(brokenRegex, 'https://www.figma.com/file/abc123/Design-System?node-id=0:1'))
        .toBe('Design-System?node-id=0:1');
    });
  });

  describe('npm-package', () => {
    const urlRegex = 'npmjs\\.com/package/([^/]+)';

    it('url: extracts package name', () => {
      expect(matchUrl(urlRegex, 'https://www.npmjs.com/package/react')).toBe('react');
      expect(matchUrl(urlRegex, 'https://www.npmjs.com/package/lodash')).toBe('lodash');
    });
  });

  // ─────────────────────────────────────────────────────────
  // PRODUCTIVITY & TICKETS
  // ─────────────────────────────────────────────────────────

  describe('jira-ticket', () => {
    // FIXED: was \\[([A-Z]+-\\d+)\\] → only matched old bracket format, missed modern Jira titles
    const titleRegex = '([A-Z]+-\\d+)';
    const urlRegex = 'browse/([A-Z]+-\\d+)';

    it('title: extracts ticket ID in brackets (old format)', () => {
      expect(matchTitle(titleRegex, '[PROJ-123] Fix the login bug')).toBe('PROJ-123');
    });

    it('title: extracts ticket ID without brackets (modern Jira format)', () => {
      expect(matchTitle(titleRegex, 'PROJ-123: Fix the login bug | Jira')).toBe('PROJ-123');
      expect(matchTitle(titleRegex, 'MYTEAM-456 Improve performance | Company Jira')).toBe('MYTEAM-456');
    });

    it('url: extracts ticket ID from /browse/ URL', () => {
      expect(matchUrl(urlRegex, 'https://company.atlassian.net/browse/PROJ-123')).toBe('PROJ-123');
      expect(matchUrl(urlRegex, 'https://mycompany.atlassian.net/browse/SPRINT-42')).toBe('SPRINT-42');
    });

    it('old broken titleRegex missed modern Jira title format', () => {
      const brokenRegex = '\\[([A-Z]+-\\d+)\\]';
      expect(matchTitle(brokenRegex, 'PROJ-123: Fix the login bug | Jira')).toBeNull();
    });
  });

  describe('trello-board', () => {
    const titleRegex = '(.+?)\\s*\\|\\s*Trello';
    const urlRegex = 'trello\\.com/b/[^/]+/(.+)';

    it('title: extracts board name', () => {
      expect(matchTitle(titleRegex, 'Project Board | Trello')).toBe('Project Board');
      expect(matchTitle(titleRegex, 'Sprint Planning Q1 | Trello')).toBe('Sprint Planning Q1');
    });

    it('url: extracts board slug', () => {
      expect(matchUrl(urlRegex, 'https://trello.com/b/abc123/project-board')).toBe('project-board');
    });
  });

  describe('notion-page', () => {
    const titleRegex = '(.+?)\\s*\\|\\s*Notion';

    it('title: extracts page title', () => {
      expect(matchTitle(titleRegex, 'Project Planning | Notion')).toBe('Project Planning');
      expect(matchTitle(titleRegex, 'Q1 Roadmap | Notion')).toBe('Q1 Roadmap');
    });
  });

  describe('asana-task', () => {
    const urlRegex = 'app\\.asana\\.com/0/([^/]+)';

    it('url: extracts project ID', () => {
      expect(matchUrl(urlRegex, 'https://app.asana.com/0/1234567890/9876543210')).toBe('1234567890');
    });
  });

  describe('salesforce-org', () => {
    // FIXED: was ([^.]+)\\.salesforce\\.com → captured "https://mycompany" instead of "mycompany"
    const urlRegex = 'https?://([^.]+)\\.';

    it('url: extracts org name from simple domain', () => {
      expect(matchUrl(urlRegex, 'https://mycompany.salesforce.com/home')).toBe('mycompany');
    });

    it('url: extracts org name from .my.salesforce.com domain', () => {
      expect(matchUrl(urlRegex, 'https://mycompany.my.salesforce.com/home')).toBe('mycompany');
    });

    it('url: extracts org name from Lightning .force.com domain', () => {
      expect(matchUrl(urlRegex, 'https://mycompany.lightning.force.com/')).toBe('mycompany');
    });
  });

  describe('miro-board', () => {
    const titleRegex = '(.+?)\\s*\\|\\s*Miro';

    it('title: extracts board name', () => {
      expect(matchTitle(titleRegex, 'Sprint Planning | Miro')).toBe('Sprint Planning');
      expect(matchTitle(titleRegex, 'Architecture Diagram | Miro')).toBe('Architecture Diagram');
    });
  });

  // ─────────────────────────────────────────────────────────
  // E-COMMERCE
  // ─────────────────────────────────────────────────────────

  describe('amazon-product', () => {
    const urlRegex = '/dp/([A-Z0-9]{10})';

    it('url: extracts ASIN', () => {
      expect(matchUrl(urlRegex, 'https://www.amazon.com/dp/B08N5WRWNW')).toBe('B08N5WRWNW');
      expect(matchUrl(urlRegex, 'https://www.amazon.fr/Some-Product-Name/dp/B0C5XFCMS3/ref=sr_1_1'))
        .toBe('B0C5XFCMS3');
    });
  });

  describe('ebay-item', () => {
    const urlRegex = 'ebay\\.[^/]+/itm/(\\d+)';

    it('url: extracts item ID', () => {
      expect(matchUrl(urlRegex, 'https://www.ebay.com/itm/293648295000')).toBe('293648295000');
      expect(matchUrl(urlRegex, 'https://www.ebay.fr/itm/123456789012')).toBe('123456789012');
    });
  });

  describe('shopify-admin', () => {
    // FIXED: was ([^.]+)\\.myshopify\\.com → captured "https://mystore" instead of "mystore"
    const urlRegex = '://([^.]+)\\.myshopify\\.com';

    it('url: extracts store name', () => {
      expect(matchUrl(urlRegex, 'https://mystore.myshopify.com/admin/products')).toBe('mystore');
      expect(matchUrl(urlRegex, 'https://cool-shop.myshopify.com/admin/orders')).toBe('cool-shop');
    });
  });

  // ─────────────────────────────────────────────────────────
  // TRAVEL & BOOKINGS
  // ─────────────────────────────────────────────────────────

  describe('airbnb-listing', () => {
    // FIXED: was (.+?)\\s*-\\s*(.+?)\\s*-\\s*Airbnb → match[1] was property type, not city
    const titleRegex = '(?:.+?)\\s*-\\s*(.+?)\\s*-\\s*Airbnb';
    const urlRegex = 'rooms/(\\d+)';

    it('title: extracts city/location (not property type)', () => {
      expect(matchTitle(titleRegex, 'Cozy apartment - Paris - Airbnb')).toBe('Paris');
      expect(matchTitle(titleRegex, 'Studio with terrace - Marseille - Airbnb')).toBe('Marseille');
    });

    it('url: extracts room ID', () => {
      expect(matchUrl(urlRegex, 'https://www.airbnb.com/rooms/12345678')).toBe('12345678');
      expect(matchUrl(urlRegex, 'https://www.airbnb.fr/rooms/99887766')).toBe('99887766');
    });

    it('old broken titleRegex returned property type instead of city', () => {
      const brokenRegex = '(.+?)\\s*-\\s*(.+?)\\s*-\\s*Airbnb';
      expect(matchTitle(brokenRegex, 'Cozy apartment - Paris - Airbnb')).toBe('Cozy apartment');
    });
  });

  describe('booking-hotel', () => {
    // FIXED: was (.+?),\\s*(.+?)\\s*- → match[1] was hotel name, not city; also missed em dash
    const titleRegex = '(?:.+?),\\s*(.+?)\\s*[-–]';
    const urlRegex = 'city=([^&]+)';

    it('title: extracts city (not hotel name), supports em dash', () => {
      expect(matchTitle(titleRegex, 'Ibis Paris Gare de Lyon, Paris – Booking.com')).toBe('Paris');
      expect(matchTitle(titleRegex, 'Hilton London Bankside, London - Booking.com')).toBe('London');
    });

    it('url: extracts city from query param', () => {
      expect(matchUrl(urlRegex, 'https://www.booking.com/searchresults.html?city=Paris&checkin=2024-06-01'))
        .toBe('Paris');
    });

    it('old broken titleRegex returned hotel name instead of city', () => {
      const brokenRegex = '(.+?),\\s*(.+?)\\s*-';
      expect(matchTitle(brokenRegex, 'Hilton London Bankside, London - Booking.com'))
        .toBe('Hilton London Bankside');
    });
  });

  describe('expedia-travel', () => {
    const urlRegex = 'destination=([^&]+)';

    it('url: extracts destination', () => {
      expect(matchUrl(urlRegex, 'https://www.expedia.com/Hotel-Search?destination=Paris&adults=2'))
        .toBe('Paris');
      expect(matchUrl(urlRegex, 'https://www.expedia.fr/Hotel-Search?destination=New+York'))
        .toBe('New+York');
    });
  });

  describe('skyscanner-flights', () => {
    // FIXED titleRegex: was (.+?)\\s*to\\s*(.+?)\\s*- → match[1] was origin, not destination
    // FIXED urlRegex: was flights/([^/]+)/([^/]+) → match[1] was origin airport, not destination
    const titleRegex = '(?:.+?)\\s*to\\s*(.+?)\\s*[-–]';
    const urlRegex = '(?:flights|vols)/(?:[^/]+)/([^/]+)';

    it('title: extracts destination (not origin)', () => {
      expect(matchTitle(titleRegex, 'Flights from Paris to London - Skyscanner')).toBe('London');
      expect(matchTitle(titleRegex, 'Cheap flights from Lyon to New York - Skyscanner')).toBe('New York');
    });

    it('url: extracts destination airport code from English URL', () => {
      expect(matchUrl(urlRegex, 'https://www.skyscanner.com/transport/flights/cdg/lhr/')).toBe('lhr');
    });

    it('url: extracts destination airport code from French URL (vols)', () => {
      expect(matchUrl(urlRegex, 'https://www.skyscanner.fr/transport/vols/pari/lon/')).toBe('lon');
    });

    it('old broken titleRegex returned origin instead of destination', () => {
      const brokenRegex = '(.+?)\\s*to\\s*(.+?)\\s*-';
      expect(matchTitle(brokenRegex, 'Flights from Paris to London - Skyscanner')).toBe('Flights from Paris');
    });

    it('old broken urlRegex returned origin airport instead of destination', () => {
      const brokenRegex = 'flights/([^/]+)/([^/]+)';
      expect(matchUrl(brokenRegex, 'https://www.skyscanner.com/transport/flights/cdg/lhr/')).toBe('cdg');
    });
  });

  // ─────────────────────────────────────────────────────────
  // SEARCH & DOCUMENTATION
  // ─────────────────────────────────────────────────────────

  describe('google-search', () => {
    // FIXED: was (.+?)\\s*-\\s*Recherche Google → only matched French, broke for English users
    const titleRegex = '(.+?)\\s*-\\s*(?:Recherche Google|Google Search)';
    const urlRegex = 'search\\?.*q=([^&]+)';

    it('title: extracts search term (English title)', () => {
      expect(matchTitle(titleRegex, 'javascript tutorial - Google Search')).toBe('javascript tutorial');
      expect(matchTitle(titleRegex, 'best pizza recipe - Google Search')).toBe('best pizza recipe');
    });

    it('title: extracts search term (French title)', () => {
      expect(matchTitle(titleRegex, 'tutoriel javascript - Recherche Google')).toBe('tutoriel javascript');
      expect(matchTitle(titleRegex, 'recette pizza - Recherche Google')).toBe('recette pizza');
    });

    it('url: extracts search query', () => {
      expect(matchUrl(urlRegex, 'https://www.google.com/search?q=javascript+tutorial'))
        .toBe('javascript+tutorial');
      expect(matchUrl(urlRegex, 'https://www.google.fr/search?q=recette+pizza&hl=fr'))
        .toBe('recette+pizza');
      expect(matchUrl(urlRegex, 'https://www.google.com/search?hl=en&q=test+query&sourceid=chrome'))
        .toBe('test+query');
    });

    it('old broken titleRegex failed for English titles', () => {
      const brokenRegex = '(.+?)\\s*-\\s*Recherche Google';
      expect(matchTitle(brokenRegex, 'javascript tutorial - Google Search')).toBeNull();
    });
  });

  describe('wikipedia-article', () => {
    const titleRegex = '(.+?)\\s*-\\s*Wikipedia';
    const urlRegex = 'wiki/([^#]+)';

    it('title: extracts article title', () => {
      expect(matchTitle(titleRegex, 'JavaScript - Wikipedia')).toBe('JavaScript');
      expect(matchTitle(titleRegex, 'Eiffel Tower - Wikipedia')).toBe('Eiffel Tower');
    });

    it('url: extracts article name', () => {
      expect(matchUrl(urlRegex, 'https://en.wikipedia.org/wiki/JavaScript')).toBe('JavaScript');
      expect(matchUrl(urlRegex, 'https://fr.wikipedia.org/wiki/Tour_Eiffel')).toBe('Tour_Eiffel');
    });

    it('url: strips fragment anchor', () => {
      expect(matchUrl(urlRegex, 'https://en.wikipedia.org/wiki/JavaScript#History')).toBe('JavaScript');
    });
  });

  describe('mdn-docs', () => {
    const urlRegex = 'docs/Web/([^/]+)';

    it('url: extracts web technology', () => {
      expect(matchUrl(urlRegex, 'https://developer.mozilla.org/en-US/docs/Web/JavaScript')).toBe('JavaScript');
      expect(matchUrl(urlRegex, 'https://developer.mozilla.org/fr/docs/Web/CSS')).toBe('CSS');
      expect(matchUrl(urlRegex, 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API')).toBe('API');
    });
  });

  describe('medium-article', () => {
    const urlRegex = '@([^/]+)';

    it('url: extracts author username', () => {
      expect(matchUrl(urlRegex, 'https://medium.com/@john_doe/my-article-slug-abc123')).toBe('john_doe');
      expect(matchUrl(urlRegex, 'https://medium.com/@techwriter/top-10-tips')).toBe('techwriter');
    });
  });

  // ─────────────────────────────────────────────────────────
  // SOCIAL NETWORKS
  // ─────────────────────────────────────────────────────────

  describe('linkedin-profile', () => {
    const urlRegex = 'linkedin\\.com/in/([^/]+)';

    it('url: extracts profile slug', () => {
      expect(matchUrl(urlRegex, 'https://www.linkedin.com/in/john-doe-123456')).toBe('john-doe-123456');
      expect(matchUrl(urlRegex, 'https://www.linkedin.com/in/jane-smith/')).toBe('jane-smith');
    });
  });

  describe('twitter-user', () => {
    // FIXED: was /([^/]+) → matched domain "twitter.com" from https:// instead of username
    const urlRegex = '(?:twitter|x)\\.com/([^/?#]+)';

    it('url: extracts username', () => {
      expect(matchUrl(urlRegex, 'https://twitter.com/elonmusk')).toBe('elonmusk');
      expect(matchUrl(urlRegex, 'https://x.com/OpenAI')).toBe('OpenAI');
      expect(matchUrl(urlRegex, 'https://www.twitter.com/nasa/status/123456')).toBe('nasa');
    });

    it('old broken urlRegex returned domain name instead of username', () => {
      const brokenRegex = '/([^/]+)';
      expect(matchUrl(brokenRegex, 'https://twitter.com/elonmusk')).toBe('twitter.com');
    });
  });

  describe('reddit-subreddit', () => {
    const urlRegex = 'reddit\\.com/r/([^/]+)';

    it('url: extracts subreddit name', () => {
      expect(matchUrl(urlRegex, 'https://www.reddit.com/r/programming/')).toBe('programming');
      expect(matchUrl(urlRegex, 'https://www.reddit.com/r/javascript/comments/abc123/title')).toBe('javascript');
    });
  });

  describe('slack-workspace', () => {
    // FIXED: was ([^.]+)\\.slack\\.com → captured "https://myteam" instead of "myteam"
    const urlRegex = '://([^.]+)\\.slack\\.com';

    it('url: extracts workspace name', () => {
      expect(matchUrl(urlRegex, 'https://myteam.slack.com/messages/general')).toBe('myteam');
      expect(matchUrl(urlRegex, 'https://company-name.slack.com/channels/engineering')).toBe('company-name');
    });
  });

  describe('zoom-meeting', () => {
    const titleRegex = 'Zoom Meeting ID: (\\d+)';
    const urlRegex = 'zoom\\.us/j/(\\d+)';

    it('title: extracts meeting ID', () => {
      expect(matchTitle(titleRegex, 'Zoom Meeting ID: 123456789')).toBe('123456789');
    });

    it('url: extracts meeting ID', () => {
      expect(matchUrl(urlRegex, 'https://zoom.us/j/98765432100?pwd=abc123')).toBe('98765432100');
      expect(matchUrl(urlRegex, 'https://us04web.zoom.us/j/71234567890')).toBe('71234567890');
    });
  });

  // ─────────────────────────────────────────────────────────
  // STREAMING & MEDIA
  // ─────────────────────────────────────────────────────────

  describe('youtube-video', () => {
    const urlRegex = '(?:watch\\?v=|youtu\\.be/)([^&?]+)';

    it('url: extracts video ID from watch URL', () => {
      expect(matchUrl(urlRegex, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(matchUrl(urlRegex, 'https://www.youtube.com/watch?v=jNQXAC9IVRw&list=PLxyz')).toBe('jNQXAC9IVRw');
    });

    it('url: extracts video ID from youtu.be short URL', () => {
      expect(matchUrl(urlRegex, 'https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(matchUrl(urlRegex, 'https://youtu.be/jNQXAC9IVRw?t=42')).toBe('jNQXAC9IVRw');
    });
  });

  describe('youtube-channel', () => {
    const titleRegex = '(.+?)\\s*-\\s*YouTube';
    // FIXED: was youtube\\.com/(c|channel|user|@)/([^/]+) → match[1] was "c"/"channel"/etc, not the name
    // Also fixed: @handle format has no "/" between "@" and the name
    const urlRegex = 'youtube\\.com/(?:(?:c|channel|user)/|@)([^/?]+)';

    it('title: extracts channel name', () => {
      expect(matchTitle(titleRegex, 'Fireship - YouTube')).toBe('Fireship');
      expect(matchTitle(titleRegex, 'Traversy Media - YouTube')).toBe('Traversy Media');
    });

    it('url: extracts channel name (not path prefix)', () => {
      expect(matchUrl(urlRegex, 'https://www.youtube.com/c/Fireship')).toBe('Fireship');
      expect(matchUrl(urlRegex, 'https://www.youtube.com/@mkbhd')).toBe('mkbhd');
      expect(matchUrl(urlRegex, 'https://www.youtube.com/channel/UCVHFbw7woebKtfvEonZQXAg'))
        .toBe('UCVHFbw7woebKtfvEonZQXAg');
      expect(matchUrl(urlRegex, 'https://www.youtube.com/user/PewDiePie')).toBe('PewDiePie');
    });

    it('old broken urlRegex returned "c"/"channel" instead of channel name', () => {
      const brokenRegex = 'youtube\\.com/(c|channel|user|@)/([^/]+)';
      expect(matchUrl(brokenRegex, 'https://www.youtube.com/c/Fireship')).toBe('c');
      expect(matchUrl(brokenRegex, 'https://www.youtube.com/channel/UCVHFbw7woebKtfvEonZQXAg')).toBe('channel');
    });
  });

  describe('netflix-title', () => {
    // FIXED: was netflix\\.com/[a-z]{2}/title/(\\d+) → required lang prefix, missed plain /title/ URLs
    const urlRegex = 'netflix\\.com/(?:[a-z-]+/)?title/(\\d+)';

    it('url: extracts title ID without region prefix', () => {
      expect(matchUrl(urlRegex, 'https://www.netflix.com/title/80018499')).toBe('80018499');
    });

    it('url: extracts title ID with 2-letter region prefix', () => {
      expect(matchUrl(urlRegex, 'https://www.netflix.com/fr/title/80018499')).toBe('80018499');
    });

    it('url: extracts title ID with locale (fr-fr format)', () => {
      expect(matchUrl(urlRegex, 'https://www.netflix.com/fr-fr/title/70143836')).toBe('70143836');
    });

    it('old broken urlRegex failed for URLs without region prefix', () => {
      const brokenRegex = 'netflix\\.com/[a-z]{2}/title/(\\d+)';
      expect(matchUrl(brokenRegex, 'https://www.netflix.com/title/80018499')).toBeNull();
    });
  });

  describe('spotify-track', () => {
    const urlRegex = 'spotify\\.com/track/([^?]+)';

    it('url: extracts track ID', () => {
      expect(matchUrl(urlRegex, 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'))
        .toBe('4iV5W9uYEdYUVa79Axb7Rh');
      expect(matchUrl(urlRegex, 'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=abc'))
        .toBe('6rqhFgbbKwnb9MLmUQDhG6');
    });
  });

  describe('twitch-channel', () => {
    const urlRegex = 'twitch\\.tv/([^/]+)';

    it('url: extracts channel name', () => {
      expect(matchUrl(urlRegex, 'https://www.twitch.tv/ninja')).toBe('ninja');
      expect(matchUrl(urlRegex, 'https://www.twitch.tv/shroud/videos')).toBe('shroud');
    });
  });

  // ─────────────────────────────────────────────────────────
  // CLOUD & INFRASTRUCTURE
  // ─────────────────────────────────────────────────────────

  describe('aws-console', () => {
    const urlRegex = 'console\\.aws\\.amazon\\.com/([^/]+)';

    it('url: extracts AWS service name', () => {
      expect(matchUrl(urlRegex, 'https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1'))
        .toBe('ec2');
      expect(matchUrl(urlRegex, 'https://eu-west-1.console.aws.amazon.com/s3/buckets')).toBe('s3');
      expect(matchUrl(urlRegex, 'https://console.aws.amazon.com/lambda/home?region=us-east-1')).toBe('lambda');
    });
  });

  describe('azure-portal', () => {
    const urlRegex = 'resourceGroups/([^/]+)';

    it('url: extracts resource group name', () => {
      expect(matchUrl(urlRegex, 'https://portal.azure.com/#resource/subscriptions/xxx/resourceGroups/my-rg/overview'))
        .toBe('my-rg');
      expect(matchUrl(urlRegex, 'https://portal.azure.com/#blade/resourceGroups/production-rg'))
        .toBe('production-rg');
    });
  });

  describe('vercel-dashboard', () => {
    const titleRegex = '(.+?)\\s*–\\s*Vercel';
    const urlRegex = 'vercel\\.com/[^/]+/([^/]+)';

    it('title: extracts project name (em dash)', () => {
      expect(matchTitle(titleRegex, 'my-project – Vercel')).toBe('my-project');
      expect(matchTitle(titleRegex, 'awesome-app – Vercel')).toBe('awesome-app');
    });

    it('url: extracts project name', () => {
      expect(matchUrl(urlRegex, 'https://vercel.com/myteam/my-project')).toBe('my-project');
      expect(matchUrl(urlRegex, 'https://vercel.com/johndoe/portfolio-site/deployments')).toBe('portfolio-site');
    });
  });

  // ─────────────────────────────────────────────────────────
  // FINANCE & BANKING
  // ─────────────────────────────────────────────────────────

  describe('coinbase-crypto', () => {
    const urlRegex = 'coinbase\\.com/price/([^/]+)';

    it('url: extracts crypto name', () => {
      expect(matchUrl(urlRegex, 'https://www.coinbase.com/price/bitcoin')).toBe('bitcoin');
      expect(matchUrl(urlRegex, 'https://www.coinbase.com/price/ethereum')).toBe('ethereum');
    });
  });

  describe('tradingview-chart', () => {
    const urlRegex = 'symbol=([^&]+)';

    it('url: extracts trading symbol', () => {
      expect(matchUrl(urlRegex, 'https://www.tradingview.com/chart/?symbol=NASDAQ:AAPL'))
        .toBe('NASDAQ:AAPL');
      expect(matchUrl(urlRegex, 'https://www.tradingview.com/chart/abc/?symbol=BINANCE:BTCUSDT'))
        .toBe('BINANCE:BTCUSDT');
    });
  });

  // ─────────────────────────────────────────────────────────
  // EDUCATION & LEARNING
  // ─────────────────────────────────────────────────────────

  describe('udemy-course', () => {
    const titleRegex = '(.+?)\\s*\\|\\s*Udemy';
    const urlRegex = 'udemy\\.com/course/([^/]+)';

    it('title: extracts course name', () => {
      expect(matchTitle(titleRegex, 'JavaScript: The Complete Guide 2024 | Udemy'))
        .toBe('JavaScript: The Complete Guide 2024');
      expect(matchTitle(titleRegex, 'Python Bootcamp | Udemy')).toBe('Python Bootcamp');
    });

    it('url: extracts course slug', () => {
      expect(matchUrl(urlRegex, 'https://www.udemy.com/course/the-complete-javascript-course/'))
        .toBe('the-complete-javascript-course');
    });
  });

  describe('coursera-course', () => {
    const titleRegex = '(.+?)\\s*\\|\\s*Coursera';
    const urlRegex = 'coursera\\.org/learn/([^/]+)';

    it('title: extracts course name', () => {
      expect(matchTitle(titleRegex, 'Machine Learning | Coursera')).toBe('Machine Learning');
      expect(matchTitle(titleRegex, 'Deep Learning Specialization | Coursera'))
        .toBe('Deep Learning Specialization');
    });

    it('url: extracts course slug', () => {
      expect(matchUrl(urlRegex, 'https://www.coursera.org/learn/machine-learning')).toBe('machine-learning');
    });
  });
});
