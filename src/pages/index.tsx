import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiLoader, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';

import { ptBR } from 'date-fns/locale';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string | null;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState<string | null>(next_page);
  const [loading, setLoading] = useState(false);

  async function handleNextPage(): Promise<void> {
    setLoading(true);
    const response = await (await fetch(next_page)).json();

    if (response?.results) {
      const newPosts = response.results.map(post => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }));

      setPosts([...posts, ...newPosts]);
      setNextPage(response.next_page);
    }

    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Home | Spacing traveling</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <section className={styles.content}>
          {posts.map((post: Post) => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div>
                  <span>
                    <FiCalendar />{' '}
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </section>
        {nextPage &&
          (loading ? (
            <FiLoader className={styles.loading} />
          ) : (
            <button
              type="button"
              className={styles.morePostsButton}
              onClick={handleNextPage}
            >
              Carregar mais posts
            </button>
          ))}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const { results, next_page } = await prismic.getByType('posts', {
    pageSize: 2,
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    orderings: ['document.first_publication_date desc'],
  });

  const posts = results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: { postsPagination: { next_page, results: posts } },
  };
};
