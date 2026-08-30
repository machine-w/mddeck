# XSS Sanitization Test

Inline HTML with dangerous script:

<script>alert('xss')</script>

Safe inline: <strong>bold</strong> and <em>italic</em>.

Link with javascript: URL in markdown: [click](javascript:alert('xss'))

A `<a href="javascript:alert('xss')" target="_self">link</a>` written as raw HTML.
