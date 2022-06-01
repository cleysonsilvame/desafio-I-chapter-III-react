import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import * as prismicH from '@prismicio/helpers';

import { Fragment } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
      alt: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  function calculateReadingTime(): string {
    const wordsPerMinute = 200;
    const words = post.data.content.reduce((acc, { heading, body }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bodyText = prismicH.asText(body as any);

      acc.push(...heading.split(' '));
      acc.push(...bodyText.split(' '));

      return acc;
    }, []);

    const minutes = Math.ceil(words.length / wordsPerMinute);

    return `${minutes} min`;
  }

  if (router.isFallback) return <p>Carregando...</p>;

  return (
    <>
      <Head>
        <title>Post | Spacing traveling</title>
      </Head>
      <Header />
      <img
        src={post.data.banner.url}
        alt={post.data.banner.alt}
        className={styles.banner}
      />
      <main className={commonStyles.container}>
        <div className={styles.container}>
          <header>
            <h1>{post.data.title}</h1>
            <div>
              <span>
                <FiCalendar />{' '}
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <FiUser /> {post.data.author}
              </span>
              <span>
                <FiClock /> {calculateReadingTime()}
              </span>
            </div>
          </header>
          <article>
            <p>{post.data.subtitle}</p>
            {post.data.content.map(({ heading, body }) => (
              <Fragment key={heading}>
                <h2>{heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    __html: prismicH.asHTML(body as any),
                  }}
                />
              </Fragment>
            ))}
          </article>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
        alt: response.data.banner.alt,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
  };
};
