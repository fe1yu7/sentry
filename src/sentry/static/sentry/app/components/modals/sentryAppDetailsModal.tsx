import {Box, Flex} from 'reflexbox';
import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';

import Access from 'app/components/acl/access';
import Button from 'app/components/button';
import PluginIcon from 'app/plugins/components/pluginIcon';
import SentryTypes from 'app/sentryTypes';
import space from 'app/styles/space';
import {t, tct} from 'app/locale';

import AsyncComponent from 'app/components/asyncComponent';
import HookStore from 'app/stores/hookStore';
import marked, {singleLineRenderer} from 'app/utils/marked';
import {IconWarning} from 'app/icons';
import Tag from 'app/views/settings/components/tag';
import {toPermissions} from 'app/utils/consolidatedScopes';
import CircleIndicator from 'app/components/circleIndicator';
import {SentryAppDetailsModalOptions} from 'app/actionCreators/modal';
import {Hooks} from 'app/types/hooks';
import {IntegrationFeature} from 'app/types';
import {recordInteraction} from 'app/utils/recordSentryAppInteraction';
import {trackIntegrationEvent} from 'app/utils/integrationUtil';

type Props = {
  view?: 'integrations_page' | 'external_install';
  closeModal: () => void;
} & SentryAppDetailsModalOptions &
  AsyncComponent['props'];

const defaultFeatureGateComponents = {
  IntegrationFeatures: p =>
    p.children({
      disabled: false,
      disabledReason: null,
      ungatedFeatures: p.features,
      gatedFeatureGroups: [],
    }),
  FeatureList: p => (
    <ul>
      {p.features.map((f, i) => (
        <li key={i}>{f.description}</li>
      ))}
    </ul>
  ),
} as ReturnType<Hooks['integrations:feature-gates']>;

type State = {
  featureData: IntegrationFeature[];
} & AsyncComponent['state'];

export default class SentryAppDetailsModal extends AsyncComponent<Props, State> {
  static propTypes = {
    sentryApp: SentryTypes.SentryApplication.isRequired,
    organization: SentryTypes.Organization.isRequired,
    onInstall: PropTypes.func.isRequired,
    isInstalled: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    onCloseModal: PropTypes.func,
    view: PropTypes.string.isRequired,
  };

  static defaultProps = {
    view: 'integrations_page',
  };

  componentDidUpdate(prevProps: Props) {
    //if the user changes org, count this as a fresh event to track
    if (this.props.organization.id !== prevProps.organization.id) {
      this.trackOpened();
    }
  }

  componentDidMount() {
    this.trackOpened();
  }

  componentWillUnmount() {
    this.props.onCloseModal?.();
  }

  trackOpened() {
    const {sentryApp, organization, isInstalled, view} = this.props;
    recordInteraction(sentryApp.slug, 'sentry_app_viewed');

    trackIntegrationEvent(
      {
        eventKey: 'integrations.install_modal_opened',
        eventName: 'Integrations: Install Modal Opened',
        integration_type: 'sentry_app',
        integration: sentryApp.slug,
        already_installed: isInstalled,
        view,
        integration_status: sentryApp.status,
      },
      organization,
      {startSession: view === 'external_install'} //new session on external installs
    );
  }

  getEndpoints(): [string, string][] {
    const {sentryApp} = this.props;
    return [['featureData', `/sentry-apps/${sentryApp.slug}/features/`]];
  }

  featureTags(features: IntegrationFeature[]) {
    return features.map(feature => {
      const feat = feature.featureGate.replace(/integrations/g, '');
      return <StyledTag key={feat}>{feat.replace(/-/g, ' ')}</StyledTag>;
    });
  }

  get permissions() {
    return toPermissions(this.props.sentryApp.scopes);
  }

  async onInstall() {
    const {onInstall, closeModal, view} = this.props;
    //we want to make sure install finishes before we close the modal
    //and we should close the modal if there is an error as well
    try {
      await onInstall();
    } catch (_err) {
      /* stylelint-disable-next-line no-empty-block */
    }
    // let onInstall handle redirection post install on the external install flow
    view !== 'external_install' && closeModal();
  }

  renderPermissions() {
    const permissions = this.permissions;
    if (
      Object.keys(permissions).filter(scope => permissions[scope].length > 0).length === 0
    ) {
      return null;
    }

    return (
      <React.Fragment>
        <Title>Permissions</Title>
        {permissions.read.length > 0 && (
          <Permission>
            <Indicator />
            <Text key="read">
              {tct('[read] access to [resources] resources', {
                read: <strong>Read</strong>,
                resources: permissions.read.join(', '),
              })}
            </Text>
          </Permission>
        )}
        {permissions.write.length > 0 && (
          <Permission>
            <Indicator />
            <Text key="write">
              {tct('[read] and [write] access to [resources] resources', {
                read: <strong>Read</strong>,
                write: <strong>Write</strong>,
                resources: permissions.read.join(', '),
              })}
            </Text>
          </Permission>
        )}
        {permissions.admin.length > 0 && (
          <Permission>
            <Indicator />
            <Text key="admin">
              {tct('[admin] access to [resources] resources', {
                admin: <strong>Admin</strong>,
                resources: permissions.read.join(', '),
              })}
            </Text>
          </Permission>
        )}
      </React.Fragment>
    );
  }

  renderBody() {
    const {sentryApp, closeModal, isInstalled, organization} = this.props;
    const {featureData} = this.state;
    // Prepare the features list
    const features = (featureData || []).map(f => ({
      featureGate: f.featureGate,
      description: (
        <span dangerouslySetInnerHTML={{__html: singleLineRenderer(f.description)}} />
      ),
    }));

    const defaultHook = () => defaultFeatureGateComponents;
    const featureHook = HookStore.get('integrations:feature-gates')[0] || defaultHook;
    const {FeatureList, IntegrationFeatures} = featureHook();

    const overview = sentryApp.overview || '';
    const featureProps = {organization, features};

    return (
      <React.Fragment>
        <Flex alignItems="center" mb={2}>
          <PluginIcon pluginId={sentryApp.slug} size={50} />

          <Flex
            pl={1}
            alignItems="flex-start"
            flexDirection="column"
            justifyContent="center"
          >
            <Name>{sentryApp.name}</Name>
            <Flex>{features.length && this.featureTags(features)}</Flex>
          </Flex>
        </Flex>

        <Description dangerouslySetInnerHTML={{__html: marked(overview)}} />
        <FeatureList {...featureProps} provider={{...sentryApp, key: sentryApp.slug}} />

        <IntegrationFeatures {...featureProps}>
          {({disabled, disabledReason}) => (
            <React.Fragment>
              {!disabled && this.renderPermissions()}
              <Footer>
                <Author>{t('Authored By %s', sentryApp.author)}</Author>
                <div>
                  {disabled && <DisabledNotice reason={disabledReason} />}
                  <Button size="small" onClick={closeModal}>
                    {t('Cancel')}
                  </Button>

                  <Access organization={organization} access={['org:integrations']}>
                    {({hasAccess}) =>
                      hasAccess && (
                        <Button
                          size="small"
                          priority="primary"
                          disabled={isInstalled || disabled}
                          onClick={() => this.onInstall()}
                          style={{marginLeft: space(1)}}
                          data-test-id="install"
                        >
                          {t('Accept & Install')}
                        </Button>
                      )
                    }
                  </Access>
                </div>
              </Footer>
            </React.Fragment>
          )}
        </IntegrationFeatures>
      </React.Fragment>
    );
  }
}

const Name = styled(Box)`
  font-weight: bold;
  font-size: 1.4em;
  margin-bottom: ${space(1)};
`;

const Description = styled('div')`
  font-size: 1.5rem;
  line-height: 2.1rem;
  margin-bottom: ${space(2)};

  li {
    margin-bottom: 6px;
  }
`;

const Author = styled(Box)`
  color: ${p => p.theme.gray2};
`;

const DisabledNotice = styled(({reason, ...p}: {reason: React.ReactNode}) => (
  <Flex alignItems="center" flex={1} {...p}>
    <IconWarning size="lg" />
    <Box ml={1}>{reason}</Box>
  </Flex>
))`
  color: ${p => p.theme.red};
  font-size: 0.9em;
`;

const StyledTag = styled(Tag)`
  &:not(:first-child) {
    margin-left: ${space(0.5)};
  }
`;

const Text = styled('p')`
  margin: 0px 6px;
`;

const Permission = styled('div')`
  display: flex;
`;

const Footer = styled('div')`
  display: flex;
  padding: 20px 30px;
  border-top: 1px solid #e2dee6;
  margin: 20px -30px -30px;
  justify-content: space-between;
`;

const Title = styled('p')`
  margin-bottom: ${space(1)};
  font-weight: bold;
`;

const Indicator = styled(p => <CircleIndicator size={7} {...p} />)`
  margin-top: 7px;
  color: ${p => p.theme.success};
`;
