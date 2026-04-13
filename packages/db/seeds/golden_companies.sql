-- Golden validation dataset for issuer/security identity resolution.
-- Day 20 scope: robust non-trivial edge cases for deterministic regression checks.

INSERT INTO golden_company_cases (
    case_id,
    company_anchor_key,
    scenario_type,
    filing_id,
    filing_date,
    security_key,
    observed_name,
    corporate_event,
    expected_identity_group,
    expected_outcome,
    case_rationale
)
VALUES
    -- Name changes: canonical identity should stay stable across legal/brand transitions.
    ('NAME-001', '0000320193', 'name_changes', '10-K-2010', '2010-10-27', 'US0378331005', 'Apple Computer, Inc.', 'legacy_name', 'ISSUER-APPLE', 'same_issuer', 'Validates historical legal name continuity.'),
    ('NAME-002', '0000320193', 'name_changes', '10-K-2011', '2011-10-26', 'US0378331005', 'Apple Inc.', 'rename', 'ISSUER-APPLE', 'same_issuer', 'Ensures rename does not create a second issuer identity.'),

    -- Multiple securities: same issuer with multiple active classes/instruments.
    ('MULTI-001', '0001067983', 'multiple_securities', 'S-1-CLASSA', '2012-05-18', 'US30303M1027', 'Meta Platforms, Inc.', 'class_a_listing', 'ISSUER-META', 'issuer_shared_across_securities', 'Prevents one-security-per-issuer assumptions.'),
    ('MULTI-002', '0001067983', 'multiple_securities', '8-K-CONVERT', '2013-03-01', 'US30303M2017', 'Meta Platforms, Inc.', 'convertible_note', 'ISSUER-META', 'issuer_shared_across_securities', 'Checks debt/equity instruments map to one issuer.'),

    -- Amended filings: amended records should supersede fields, not fork identity.
    ('AMD-001', '0001652044', 'amended_filings', '10-K-2021', '2022-02-02', 'US02079K3059', 'Alphabet Inc.', 'original_filing', 'ISSUER-ALPHABET', 'pre_amend_snapshot', 'Baseline before amendment ingestion.'),
    ('AMD-002', '0001652044', 'amended_filings', '10-K/A-2021', '2022-03-15', 'US02079K3059', 'Alphabet Inc.', 'amendment', 'ISSUER-ALPHABET', 'amend_without_identity_split', 'Ensures amendment merges into existing entity timeline.'),

    -- Complex histories: mergers/spinoffs/relistings through time windows.
    ('HIST-001', '0000732717', 'complex_histories', '8-K-MERGER', '2019-06-03', 'US24703L2025', 'Delta Legacy Holdings', 'merger_preclose', 'ISSUER-DELTA-COMPLEX', 'timeline_branch_pre_merge', 'Captures pre-merger identity window.'),
    ('HIST-002', '0000732717', 'complex_histories', '8-K-MERGER-CLOSE', '2019-09-30', 'US24703L3015', 'Delta Unified Holdings', 'merger_postclose_relist', 'ISSUER-DELTA-COMPLEX', 'timeline_branch_post_merge', 'Validates post-close relist continuity to same master issuer.'),

    -- Identity ambiguity edge cases: similar names/cross-listed symbols should not collapse.
    ('AMB-001', '0000917659', 'identity_ambiguity', '20-F-2023', '2023-04-01', 'USG4766E1091', 'Global Tech PLC', 'cross_listed_ads', 'ISSUER-GLOBALTECH-UK', 'distinct_from_us_peer', 'Disambiguates similarly named foreign issuer from US domestic peer.'),
    ('AMB-002', '0001173431', 'identity_ambiguity', '10-K-2023', '2023-03-28', 'US37891X2036', 'GlobalTech, Inc.', 'domestic_common_stock', 'ISSUER-GLOBALTECH-US', 'distinct_from_uk_peer', 'Prevents fuzzy-name false-positive merges.');
